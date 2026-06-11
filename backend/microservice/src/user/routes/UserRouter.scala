package microservice.user.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.system.objects.ApiSuccess
import microservice.user.api.GetUserProfileAPIMessage
import org.http4s.HttpRoutes
import org.http4s.dsl.io._

/** 用户资料（profile）层的 HTTP 路由。
  *
  * 挂载前缀：/users。
  * 与 AuthRouter 同属 user 模块：Auth 管「是谁」，UserRouter 管「资料页展示什么」。
  */
object UserRouter {

  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {

      // GET /users/:profileUserId/profile — 查看某用户的公开资料聚合
      case req @ GET -> Root / profileUserId / "profile" =>
        // 当前访问者 ID：演示环境下由前端在每个请求头注入 x-user-id
        val viewerUserId =
          req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)

        viewerUserId match {
          case Some(currentUserId) =>
            // viewer 与 profile 目标可以不同（例如查看他人主页）；校验逻辑在 GetUserProfileAPIMessage 内
            GetUserProfileAPIMessage(currentUserId, profileUserId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(profile => ApiSuccess(profile))))

          case None =>
            // 缺少身份上下文时直接 401，不进入 APIMessage
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
