package microservice.routes

import cats.effect.IO
import microservice.admin.api.AdminReviewService
import microservice.admin.routes.AdminRouter
import microservice.auth.api.AuthService
import microservice.auth.routes.AuthRouter
import microservice.level.api.{DesignerLevelService, PlayerRatingService}
import microservice.level.routes.{DesignerLevelRouter, PlayerLevelRouter}
import microservice.user.api.UserService
import microservice.user.routes.UserRouter
import org.http4s.HttpRoutes
import org.http4s.server.Router

object ApiRouter {
  def routes(
    authService: AuthService,
    userService: UserService,
    designerLevelService: DesignerLevelService,
    playerRatingService: PlayerRatingService,
    adminReviewService: AdminReviewService
  ): HttpRoutes[IO] =
    Router(
      "/" -> HealthRouter.routes,
      "/auth" -> AuthRouter.routes(authService),
      "/users" -> UserRouter.routes(userService),
      "/designer" -> DesignerLevelRouter.routes(designerLevelService),
      "/player" -> PlayerLevelRouter.routes(playerRatingService),
      "/admin" -> AdminRouter.routes(adminReviewService)
    )
}
