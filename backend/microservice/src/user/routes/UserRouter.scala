package microservice.user.routes

import cats.effect.IO
import microservice.core.{DatabaseSession, HttpError}
import microservice.system.objects.ApiSuccess
import microservice.user.api.GetUserProfileAPIMessage
import org.http4s.HttpRoutes
import org.http4s.dsl.io._

object UserRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / userId / "profile" =>
        val viewerUserId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        viewerUserId match {
          case Some(currentUserId) =>
            GetUserProfileAPIMessage(currentUserId, userId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(profile => ApiSuccess(profile))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
