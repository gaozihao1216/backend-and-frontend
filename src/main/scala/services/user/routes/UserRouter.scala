package coursebackend.services.user.routes

import cats.effect.IO
import coursebackend.HttpError
import coursebackend.services.system.objects.ApiSuccess
import coursebackend.services.user.api.{GetUserProfileRequest, UserService}
import org.http4s.HttpRoutes
import org.http4s.dsl.io._

object UserRouter {
  def routes(userService: UserService): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / userId / "profile" =>
        val viewerUserId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        val result = viewerUserId match {
          case Some(currentUserId) =>
            userService.getUserProfile(GetUserProfileRequest(currentUserId, userId)).map(response => ApiSuccess(response.profile))
          case None =>
            Left(HttpError.unauthorized("Missing x-user-id header"))
        }
        HttpError.fromEither(result)
    }
}
