package microservice.user.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.system.objects.ApiSuccess
import microservice.user.api.GetUserProfileAPIMessage
import org.http4s.HttpRoutes
import org.http4s.dsl.io._

/** 用户资料（profile）层的 HTTP 路由。 */
object UserRouter {

  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / profileUserId / "profile" =>
        val currentUserId = AuthMiddleware.userIdFromRequest(req).get
        GetUserProfileAPIMessage(currentUserId, profileUserId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(profile => ApiSuccess(profile))))
    }
}
