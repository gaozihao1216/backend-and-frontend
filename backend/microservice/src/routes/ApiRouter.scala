package microservice.routes

import cats.effect.IO
import microservice.admin.routes.AdminRouter
import cats.syntax.semigroupk._
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.AuthMiddleware
import microservice.user.routes.AuthRouter
import microservice.level.routes.{DesignerLevelRouter, PlayerLevelRouter}
import microservice.bird.routes.DesignerBirdRouter
import microservice.user.routes.UserRouter
import microservice.ui.routes.UiCustomizationRouter
import org.http4s.HttpRoutes
import org.http4s.server.Router

/** 根路由挂载：将各业务模块的 HttpRoutes 拼接到 URL 前缀下。
  *
  * 实现：http4s `Router` 按路径前缀分发；公开路由（/health、/auth）无需 x-user-id，
  *       其余路由经 [[AuthMiddleware.requireUserId]] 统一鉴权。
  * 注意：`/admin/director/ui` 必须写在 `/admin` 之前，避免被更短前缀错误匹配。
  */
object ApiRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] = {
    val publicRoutes =
      Router(
        "/" -> HealthRouter.routes(databaseSession),
        "/auth" -> AuthRouter.routes(databaseSession)
      )

    val protectedRoutes =
      AuthMiddleware.requireUserId(
        Router(
          "/users" -> UserRouter.routes(databaseSession),
          "/designer" -> (DesignerLevelRouter.routes(databaseSession) <+> DesignerBirdRouter.routes(databaseSession)),
          "/player" -> PlayerLevelRouter.routes(databaseSession),
          "/admin/director/ui" -> UiCustomizationRouter.routes(databaseSession),
          "/admin" -> AdminRouter.routes(databaseSession)
        )
      )

    publicRoutes <+> protectedRoutes
  }
}
