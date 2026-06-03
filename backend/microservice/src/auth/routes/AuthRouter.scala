package microservice.auth.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.auth.api.{BindBackendUserAPIMessage, BindBackendUserRequest, GetBackendUsersAPIMessage}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object AuthRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "backend-users" =>
        GetBackendUsersAPIMessage()
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(users => ApiSuccess(users))))

      case req @ POST -> Root / "bind" =>
        req.as[BindBackendUserRequest].flatMap { input =>
          BindBackendUserAPIMessage(input)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(user => ApiSuccess(user)), successStatus = Status.Created))
        }
    }
}
