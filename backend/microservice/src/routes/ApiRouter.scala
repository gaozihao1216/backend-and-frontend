package microservice.routes

import cats.effect.IO
import microservice.admin.routes.AdminRouter
import microservice.core.DatabaseSession
import microservice.auth.routes.AuthRouter
import microservice.level.routes.{DesignerLevelRouter, PlayerLevelRouter}
import microservice.user.routes.UserRouter
import org.http4s.HttpRoutes
import org.http4s.server.Router

object ApiRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    Router(
      "/" -> HealthRouter.routes(databaseSession),
      "/auth" -> AuthRouter.routes(databaseSession),
      "/users" -> UserRouter.routes(databaseSession),
      "/designer" -> DesignerLevelRouter.routes(databaseSession),
      "/player" -> PlayerLevelRouter.routes(databaseSession),
      "/admin" -> AdminRouter.routes(databaseSession)
    )
}
