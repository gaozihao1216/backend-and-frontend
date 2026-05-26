package coursebackend.services.auth.routes

import cats.effect.IO
import coursebackend.HttpError
import coursebackend.services.auth.api.{AuthService, BindBackendUserRequest}
import coursebackend.services.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object AuthRouter {
  def routes(authService: AuthService): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ POST -> Root / "bind" =>
        req.as[BindBackendUserRequest].flatMap { input =>
          HttpError.fromEither(
            authService.bindBackendUser(input).map(response => ApiSuccess(response.user)),
            successStatus = Status.Created
          )
        }
    }
}
