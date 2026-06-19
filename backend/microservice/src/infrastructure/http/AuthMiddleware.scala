package microservice.infrastructure.http

import cats.data.{Kleisli, OptionT}
import cats.effect.IO
import org.http4s._
import org.typelevel.ci._

/** 演示鉴权中间件：基于 HTTP 头 `x-user-id` 识别当前用户。
  *
  * == 当前实现（开发/演示） ==
  * 本仓库使用 mock 认证：前端登录后将用户 ID 写入 localStorage，
  * API 客户端在每个请求头附带 `x-user-id: <userId>`。
  * 生产环境可替换为 JWT/Cookie 解析，但路由层读取身份的接口（[[userIdFromRequest]]）应保持稳定。
  *
  * == 中间件行为 ==
  * [[requireUserId]] 用 `Kleisli` 包装一组 `HttpRoutes`：
  * - 请求含非空 `x-user-id` → 透传给内层 routes；
  * - 缺失或空白 → 短路返回 401 JSON（`UNAUTHORIZED` / "Missing x-user-id header"），不进入业务 handler。
  *
  * == 在路由树中的位置 ==
  * [[microservice.routes.ApiRouter]] 将 `/health`、`/auth` 列为公开路由；
  * `/users`、`/designer`、`/player`、`/admin` 等挂载在 `requireUserId` 之内。
  *
  * == Handler 内读取身份 ==
  * 受保护路由的 handler 应调用 `userIdFromRequest(req).get`（中间件已保证存在），
  * 再传入 `APIMessage` 或 `runAuthenticated`。
  *
  * == 关联 ==
  * - [[microservice.routes.ApiRouter]]：公开/受保护路由分层
  * - [[microservice.infrastructure.api.APIWithTokenMessage]]：plan 内二次绑定校验
  */
object AuthMiddleware {
  /** 从请求头提取已认证用户 ID；不存在或仅空白时返回 `None`。
    *
    * 使用 case-insensitive 头名（`CIString`），与 HTTP 规范一致。
    */
  def userIdFromRequest(req: Request[IO]): Option[String] =
    req.headers.get(CIString("x-user-id")).map(_.head.value.trim).filter(_.nonEmpty)

  /** 包装受保护路由：缺少 `x-user-id` 时直接 401，不再进入内层 handler。
    *
    * @param routes 需要登录后才能访问的 `HttpRoutes`（通常由 `Router(...)` 组合而成）
    * @return 包装后的 `HttpRoutes`，未匹配时仍返回 `OptionT.none` 以便外层路由继续匹配
    */
  def requireUserId(routes: HttpRoutes[IO]): HttpRoutes[IO] =
    Kleisli { req =>
      userIdFromRequest(req) match {
        case Some(_) =>
          // 身份头存在：委托内层 routes 处理（路径不匹配时内层返回 None）
          routes.run(req)
        case None =>
          // 身份头缺失：构造 401 响应，Some 表示本中间件已处理该请求
          OptionT.liftF(HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header")))
      }
    }
}
