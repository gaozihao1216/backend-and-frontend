package microservice.user.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.system.objects.ApiSuccess
import microservice.user.api.GetUserProfileAPIMessage
import org.http4s.HttpRoutes
import org.http4s.dsl.io._

/** 用户资料 HTTP 入口（profile 聚合层）。
  *
  * 实现：GET /users/:userId/profile，viewer 身份来自 x-user-id，被查看用户来自 path。
  * 关联：GetUserProfileAPIMessage 聚合 level/comment/rating 等跨模块数据；身份数据来自 user.tables.user。
  */
object UserRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / profileUserId / "profile" =>
        val viewerUserId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        viewerUserId match {
          case Some(currentUserId) =>
            GetUserProfileAPIMessage(currentUserId, profileUserId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(profile => ApiSuccess(profile))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
