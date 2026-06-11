package microservice.infrastructure.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError

/** 所有业务 API 的统一执行协议。
  *
  * 实现：
  *   - 子类实现 `plan(connection)`，在单个数据库连接上执行业务，返回 `Either[HttpError, A]`。
  *   - `run(databaseSession)` 在外层开启事务：成功 commit，Left 时通过 RollbackHttpError 触发 rollback。
  * 关联：各模块 `*APIMessage` 继承此 trait；routes 只负责构造 message 并调用 `.run`。
  */
trait APIMessage[A] {
  /** 在单连接上执行业务逻辑；子类在此实现查询/写入与权限校验。 */
  def plan(connection: Connection): IO[Either[HttpError, A]]

  /** 在 DatabaseSession 提供的事务边界内执行 plan；业务失败时自动回滚。 */
  final def run(databaseSession: DatabaseSession): IO[Either[HttpError, A]] =
    databaseSession
      .withTransaction { connection =>
        plan(connection).flatMap {
          case Right(value) =>
            // 业务成功：保持 Right，外层 withTransaction 将 commit
            IO.pure(Right(value))
          case Left(error) =>
            // 将 Left 转为异常，让 JDBC 模式的 withTransaction 执行 rollback
            IO.raiseError(APIMessage.RollbackHttpError(error))
        }
      }
      .handleErrorWith {
        case APIMessage.RollbackHttpError(error) =>
          // 捕获回滚哨兵异常，还原为 Left 供 routes 编码错误 JSON
          IO.pure(Left(error))
        case error =>
          // 非业务错误（IO/JDBC 异常）继续向上抛
          IO.raiseError(error)
      }
}

/** 需要当前用户身份的 API 标记 trait；token 字段供日志/审计扩展，实际身份以 case class 参数字段为准。 */
trait APIWithTokenMessage[A] extends APIMessage[A] {
  def token: String // 预留：OAuth/JWT 等扩展；当前多以 x-user-id 头传递身份
}

object APIMessage {
  /** 内部哨兵异常：携带 HttpError，触发事务回滚后在 handleErrorWith 中还原为 Left。 */
  private final case class RollbackHttpError(error: HttpError) extends RuntimeException(error.message)
}
