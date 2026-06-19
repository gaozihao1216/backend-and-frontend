package microservice.infrastructure.database

import cats.effect.IO
import java.sql.Connection
import java.sql.DriverManager
import microservice.infrastructure.http.HttpError

/** 数据库会话抽象：向 [[microservice.infrastructure.api.APIMessage]] 提供 `Connection` 并统一事务边界。
  *
  * == 两种运行模式 ==
  * | 模式 | 工厂方法 | Connection | 事务行为 |
  * |------|----------|------------|----------|
  * | in-memory（默认） | [[DatabaseSession.inMemory]] | 恒为 `null` | `withTransaction*` 等价于 `withConnection` |
  * | JDBC | [[DatabaseSession.jdbc]] | 真实 PostgreSQL 连接 | 显式 `setAutoCommit(false)` + commit/rollback |
  *
  * == null Connection 约定 ==
  * in-memory 模式下传入 `null` 作为哨兵值，各 `*Table` 对象检测 `connection == null` 后
  * 读写 [[InMemoryStore]] 中的可变集合，从而无需启动 PostgreSQL 即可本地开发。
  *
  * == 与 APIMessage 的协作 ==
  * `APIMessage.run` 始终调用 [[withTransactionEither]]，保证：
  * - 业务返回 `Right` → 提交；
  * - 业务返回 `Left(HttpError)` → 回滚且不抛异常（与异常驱动回滚的 `withTransaction` 区分）。
  *
  * == 环境变量 ==
  * 模式由 `UGC_DATABASE_MODE` 控制（`jdbc` 启用 JDBC，否则 in-memory），
  * 配置详情见 [[DatabaseConfig]] 与 `SystemDefaults.databaseConfig`。
  */
trait DatabaseSession {
  /** 当前会话使用的 JDBC 配置；in-memory 模式亦保留，用于日志与 `description`。 */
  def config: DatabaseConfig

  /** 人类可读的连接描述（driver:schema@url），启动时打印到日志。 */
  def description: String

  /** 获取连接（或 in-memory 哨兵）并执行 `use`；用毕后由实现方负责关闭真实 JDBC 连接。
    *
    * JDBC 实现使用 `bracket` 确保连接在 normal/cancel 路径下均被关闭。
    */
  def withConnection[A](use: Connection => IO[A]): IO[A]

  /** 在事务边界内执行 `use`：成功时 commit，抛异常时 rollback 并重新抛出。
    *
    * 适用于不返回 `Either` 的低层工具；业务 API 应优先使用 [[withTransactionEither]]。
    */
  def withTransaction[A](use: Connection => IO[A]): IO[A]

  /** 在事务边界内执行 `use`：`Right` 提交，`Left` 回滚，均不抛业务异常。
    *
    * 这是 [[microservice.infrastructure.api.APIMessage.run]] 的唯一事务入口。
    */
  def withTransactionEither[A](use: Connection => IO[Either[HttpError, A]]): IO[Either[HttpError, A]]
}

object DatabaseSession {
  /** 静默关闭 JDBC 连接，忽略 `close()` 可能抛出的异常（连接池或已关闭场景）。 */
  private def closeQuietly(connection: Connection): IO[Unit] =
    IO.blocking(connection.close()).handleErrorWith(_ => IO.unit)

  /** 构造 in-memory 会话：无需 JDBC 驱动，connection 恒为 `null`。
    *
    * `withTransaction` / `withTransactionEither` 与 `withConnection` 行为相同，
    * 因为进程内可变状态不需要 ACID 事务隔离。
    */
  def inMemory(configValue: DatabaseConfig): DatabaseSession =
    new DatabaseSession {
      override val config: DatabaseConfig = configValue
      override val description: String =
        s"${config.driver}:${config.schema}@${config.url}"

      override def withConnection[A](use: Connection => IO[A]): IO[A] =
        // null 作为哨兵值；各 Table 在 connection == null 时路由到 InMemoryStore
        use(null.asInstanceOf[Connection])

      override def withTransaction[A](use: Connection => IO[A]): IO[A] =
        withConnection(use)

      override def withTransactionEither[A](use: Connection => IO[Either[HttpError, A]]): IO[Either[HttpError, A]] =
        withConnection(use)
    }

  /** 构造 JDBC 会话：每次 [[withConnection]] 打开独立连接，用毕关闭。
    *
    * == 事务实现要点 ==
    * - 进入事务前保存 `previousAutoCommit`，退出时 `guarantee` 恢复；
    * - `withTransaction`：异常路径 rollback 后 `raiseError`；
    * - `withTransactionEither`：`Left` 仅 rollback 不抛异常；未捕获异常仍 rollback 后上抛。
    */
  def jdbc(configValue: DatabaseConfig): DatabaseSession =
    new DatabaseSession {
      override val config: DatabaseConfig = configValue
      override val description: String =
        s"${config.driver}:${config.schema}@${config.url}"

      override def withConnection[A](use: Connection => IO[A]): IO[A] =
        IO.blocking {
          Class.forName(config.driver)
          // 用户名与密码须同时提供才走显式认证；否则使用 URL 内嵌凭证或 trust 模式
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
