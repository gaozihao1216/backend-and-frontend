package microservice.admin.director.routes

import cats.effect.IO
import microservice.admin.director.api.GetDirectorPermissionsAPIMessage
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object DirectorRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "director" / "permissions" =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            GetDirectorPermissionsAPIMessage(currentUserId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(summary => ApiSuccess(summary))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
