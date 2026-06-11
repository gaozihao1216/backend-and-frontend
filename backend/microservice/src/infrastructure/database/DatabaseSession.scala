package microservice.infrastructure.database

import cats.effect.IO
import java.sql.Connection
import java.sql.DriverManager
import microservice.infrastructure.http.HttpError

/** 数据库会话抽象：向 APIMessage 提供 Connection，并统一事务边界。
  *
  * 实现两种模式：
  *   - inMemory：connection 传 null，table 层据此路由到 InMemoryStore（默认模式，无需 PostgreSQL）。
  *   - jdbc：真实 PostgreSQL 连接；withTransaction 关闭 autoCommit，成功 commit，失败 rollback。
  * 关联：[[microservice.infrastructure.api.APIMessage.run]] 始终通过 withTransaction 调用 plan。
  */
trait DatabaseSession {
  def config: DatabaseConfig   // 当前会话使用的 JDBC 配置（in-memory 模式亦保留，供日志与描述）
  def description: String      // 人类可读的连接描述，用于启动日志

  /** 获取连接并执行 use；用毕后由实现方负责关闭连接。 */
  def withConnection[A](use: Connection => IO[A]): IO[A]

  /** 在事务边界内执行 use；成功提交，异常时回滚。 */
  def withTransaction[A](use: Connection => IO[A]): IO[A]

  /** 在事务边界内执行 use；Right 提交，Left 回滚且不抛异常。 */
  def withTransactionEither[A](use: Connection => IO[Either[HttpError, A]]): IO[Either[HttpError, A]]
}

object DatabaseSession {
  /** 静默关闭连接，忽略 close 抛出的异常。 */
  private def closeQuietly(connection: Connection): IO[Unit] =
    IO.blocking(connection.close()).handleErrorWith(_ => IO.unit)

  /** 内存模式：无需 JDBC，connection 为 null；withTransaction 等价于 withConnection。 */
  def inMemory(configValue: DatabaseConfig): DatabaseSession =
    new DatabaseSession {
      override val config: DatabaseConfig = configValue
      override val description: String =
        s"${config.driver}:${config.schema}@${config.url}"

      override def withConnection[A](use: Connection => IO[A]): IO[A] =
        // null 作为哨兵值，各 Table 据此分支到 InMemoryStore
        use(null.asInstanceOf[Connection])

      override def withTransaction[A](use: Connection => IO[A]): IO[A] =
        withConnection(use)

      override def withTransactionEither[A](use: Connection => IO[Either[HttpError, A]]): IO[Either[HttpError, A]] =
        withConnection(use)
    }

  /** JDBC 模式：每次 withConnection 打开独立连接；withTransaction 包裹 commit/rollback。 */
  def jdbc(configValue: DatabaseConfig): DatabaseSession =
    new DatabaseSession {
      override val config: DatabaseConfig = configValue
      override val description: String =
        s"${config.driver}:${config.schema}@${config.url}"

      override def withConnection[A](use: Connection => IO[A]): IO[A] =
        IO.blocking {
          Class.forName(config.driver)
          // 按是否提供用户名/密码选择认证方式
          (config.username, config.password) match {
            case (Some(username), Some(password)) =>
              DriverManager.getConnection(config.url, username, password)
            case _ =>
              DriverManager.getConnection(config.url)
          }
        }.bracket(use)(closeQuietly)

      override def withTransaction[A](use: Connection => IO[A]): IO[A] =
        withConnection { connection =>
          for {
            previousAutoCommit <- IO.blocking(connection.getAutoCommit)
            _ <- IO.blocking(connection.setAutoCommit(false))
            result <- use(connection).attempt.flatMap {
              case Right(value) =>
                IO.blocking(connection.commit()).as(value)
              case Left(error) =>
                IO.blocking(connection.rollback()).attempt *> IO.raiseError[A](error)
            }.guarantee(IO.blocking(connection.setAutoCommit(previousAutoCommit)).handleErrorWith(_ => IO.unit))
          } yield result
        }

      override def withTransactionEither[A](use: Connection => IO[Either[HttpError, A]]): IO[Either[HttpError, A]] =
        withConnection { connection =>
          for {
            previousAutoCommit <- IO.blocking(connection.getAutoCommit)
            _ <- IO.blocking(connection.setAutoCommit(false))
            result <- use(connection).flatMap {
              case right @ Right(_) =>
                IO.blocking(connection.commit()).as(right)
              case left @ Left(_) =>
                IO.blocking(connection.rollback()).as(left)
            }.handleErrorWith { error =>
              IO.blocking(connection.rollback()).attempt *> IO.raiseError(error)
            }.guarantee(IO.blocking(connection.setAutoCommit(previousAutoCommit)).handleErrorWith(_ => IO.unit))
          } yield result
        }
    }
}
