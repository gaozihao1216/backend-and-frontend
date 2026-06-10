package microservice.infrastructure.database

import cats.effect.IO
import java.sql.Connection
import java.sql.DriverManager

/** 数据库会话抽象：向 APIMessage 提供 Connection，并统一事务边界。
  *
  * 实现两种模式：
  *   - inMemory：connection 传 null，table 层据此路由到 InMemoryStore（本地演示默认 seed）。
  *   - jdbc：真实 PostgreSQL 连接；withTransaction 关闭 autoCommit，成功 commit，失败 rollback。
  * 关联：[[microservice.infrastructure.api.APIMessage.run]] 始终通过 withTransaction 调用 plan。
  */
trait DatabaseSession {
  def config: DatabaseConfig
  def description: String

  def withConnection[A](use: Connection => IO[A]): IO[A]

  def withTransaction[A](use: Connection => IO[A]): IO[A]
}

object DatabaseSession {
  private def closeQuietly(connection: Connection): IO[Unit] =
    IO.blocking(connection.close()).handleErrorWith(_ => IO.unit)

  /** 内存模式：无需 JDBC，connection 为 null；withTransaction 等价于 withConnection。 */
  def inMemory(configValue: DatabaseConfig): DatabaseSession =
    new DatabaseSession {
      override val config: DatabaseConfig = configValue
      override val description: String =
        s"${config.driver}:${config.schema}@${config.url}"

      override def withConnection[A](use: Connection => IO[A]): IO[A] =
        use(null.asInstanceOf[Connection])

      override def withTransaction[A](use: Connection => IO[A]): IO[A] =
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
    }
}
