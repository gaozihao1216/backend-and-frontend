package microservice.auth.routes

import cats.effect.IO
import microservice.core.HttpError
import microservice.auth.api.{AuthService, BindBackendUserRequest}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object AuthRouter {
  def routes(authService: AuthService): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "backend-users" =>
        HttpError.fromEither(authService.getBackendUsers.map(users => ApiSuccess(users)))

      case req @ POST -> Root / "bind" =>
        req.as[BindBackendUserRequest].flatMap { input =>
          HttpError.fromEither(
            authService.bindBackendUser(input).map(response => ApiSuccess(response.user)),
            successStatus = Status.Created
          )
        }
    }
}
