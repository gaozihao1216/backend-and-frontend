package microservice.infrastructure.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError

/** 所有业务 API 的统一执行协议。
  *
  * 实现：
  *   - 子类实现 `plan(connection)`，在单个数据库连接上执行业务，返回 `Either[HttpError, A]`。
  *   - `run(databaseSession)` 在外层开启事务：Right 提交，Left 回滚（无异常驱动控制流）。
  * 关联：各模块 `*APIMessage` 继承此 trait；routes 只负责构造 message 并调用 `.run`。
  */
trait APIMessage[A] {
  /** 在单连接上执行业务逻辑；子类在此实现查询/写入与权限校验。 */
  def plan(connection: Connection): IO[Either[HttpError, A]]

  /** 在 DatabaseSession 提供的事务边界内执行 plan。 */
  final def run(databaseSession: DatabaseSession): IO[Either[HttpError, A]] =
    databaseSession.withTransactionEither(plan)
}

/** 需要当前用户身份的 API 标记 trait；token 字段供日志/审计扩展，实际身份以 case class 参数字段为准。 */
trait APIWithTokenMessage[A] extends APIMessage[A] {
  def token: String // 预留：OAuth/JWT 等扩展；当前多以 x-user-id 头传递身份
}
