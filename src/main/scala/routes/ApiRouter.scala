package coursebackend.routes

import cats.effect.IO
import coursebackend.services.admin.api.AdminReviewService
import coursebackend.services.admin.routes.AdminRouter
import coursebackend.services.auth.api.AuthService
import coursebackend.services.auth.routes.AuthRouter
import coursebackend.services.level.api.{DesignerLevelService, PlayerRatingService}
import coursebackend.services.level.routes.{DesignerLevelRouter, PlayerLevelRouter}
import coursebackend.services.user.api.UserService
import coursebackend.services.user.routes.UserRouter
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
