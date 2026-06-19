package microservice.user.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.system.objects.ApiSuccess
import microservice.user.api.GetUserProfileAPIMessage
import org.http4s.HttpRoutes
import org.http4s.dsl.io._

/** 用户资料（profile）层的 HTTP 路由。
  *
  * 定义：GET /users/:userId/profile 单路由，需 x-user-id 鉴权。
  * 问题：profile 为受保护读接口，viewer 与 token 需经 AuthMiddleware 校验。
  * 作用：解析路径 userId → GetUserProfileAPIMessage.runAuthenticated。
  * 关联：[[GetUserProfileAPIMessage]]；[[UserRouter]] 由 ApiRouter 挂载 /users。
  */
object UserRouter {

  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      // GET /users/:profileUserId/profile — 聚合资料页（需登录 x-user-id）
      case req @ GET -> Root / profileUserId / "profile" =>
        // --- 1. 从 header 取当前访问者 id（AuthMiddleware 已保证存在）---
        val currentUserId = AuthMiddleware.userIdFromRequest(req).get
        // --- 2. 执行 APIMessage 并包装 ApiSuccess ---
        GetUserProfileAPIMessage(currentUserId, profileUserId)
          .runAuthenticated(currentUserId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(profile => ApiSuccess(profile))))
    }
}
