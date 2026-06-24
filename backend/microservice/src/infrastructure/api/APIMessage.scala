package microservice.infrastructure.api

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl

/** 所有业务 API 的统一执行协议（Command 模式）。
  *
  * == 设计意图 ==
  * 将「HTTP 解析」与「业务执行」彻底分离：
  * - **Routes 层**：只负责从 Request 提取 path/header/body，构造具体的 `XxxAPIMessage` case class，调用 `.run`；
  * - **APIMessage 层**：在 `plan` 中完成权限校验、表读写、领域规则，返回 `Either[HttpError, A]`；
  * - **Table 层**：接受 JDBC `Connection` 参数，执行表读写。
  *
  * == 事务语义 ==
  * `run` 委托 [[DatabaseSession.withTransactionEither]]：
  * - 返回 `Right(value)` → 提交事务；
  * - 返回 `Left(error)`  → 回滚事务，**不抛异常**，由 routes 通过 [[HttpError.fromEither]] 编码 JSON 错误响应。
  *
  * == 典型子类 ==
  * 各模块 `*Api.scala` 中定义 `case class XxxAPIMessage(...) extends APIMessage[XxxResponse]`，
  * 在 `plan` 内使用 [[PlanSteps]] 组合鉴权与读写步骤。
  *
  * == 关联 ==
  * - [[microservice.infrastructure.database.DatabaseSession]]
  * - [[microservice.infrastructure.http.HttpError]]
  * - [[APIWithTokenMessage]]：需要校验请求体 token 与 x-user-id 一致时的标记 trait
  */
trait APIMessage[A] {
  /** 在单个数据库连接上执行业务逻辑。
    *
    * @param connection
    *   当前事务中的 JDBC `Connection`。
    * @return
    *   `Right` 表示业务成功；`Left(HttpError)` 表示可预期的业务/权限失败，由外层统一转 HTTP 响应。
    */
  def plan(connection: Connection): IO[Either[HttpError, A]]

  /** 在 [[DatabaseSession]] 提供的事务边界内执行 [[plan]]。
    *
    * 此方法为 `final`，子类不可覆盖，确保所有 API 共享同一事务策略。
    */
  final def run(databaseSession: DatabaseSession): IO[Either[HttpError, A]] =
    databaseSession.withTransactionEither(plan)
}

/** 需要当前用户身份的 API 标记 trait。
  *
  * == 使用场景 ==
  * 请求体或路径参数携带 `token`（用户绑定标识），须与 HTTP 头 `x-user-id` 一致，
  * 防止客户端伪造他人身份执行写操作。
  *
  * == 身份来源 ==
  * - `token` 字段：通常来自 case class 构造参数或请求体；
  * - `headerUserId`：由 [[microservice.infrastructure.http.AuthMiddleware]] 从 `x-user-id` 头读取后传入。
  *
  * == 与 APIMessage 的关系 ==
  * 继承 [[APIMessage]] 并额外提供 `runAuthenticated`，在调用 `run` 之前先做绑定校验。
  * `token` 字段亦可供日志/审计扩展（如未来接入 OAuth/JWT）。
  */
trait APIWithTokenMessage[A] extends APIMessage[A] {
  /** 当前操作所声称的用户标识；须与 x-user-id 头一致。 */
  def token: String

  /** 先校验 x-user-id 与 token 绑定，通过后再进入事务化的 [[run]]。
    *
    * @param headerUserId 由路由从 `AuthMiddleware.userIdFromRequest` 取得的已认证用户 ID
    * @param databaseSession 当前进程的 JDBC 数据库会话
    */
  final def runAuthenticated(headerUserId: String, databaseSession: DatabaseSession): IO[Either[HttpError, A]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireBoundIdentity(headerUserId, token)
        result <- EitherT(run(databaseSession))
      } yield result
    }
}
