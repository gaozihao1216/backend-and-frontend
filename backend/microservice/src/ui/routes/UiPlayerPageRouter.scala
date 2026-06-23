package microservice.ui.routes

import cats.effect.IO
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.system.objects.ApiSuccess
import microservice.ui.api.pages.{GetPlayerUiPageAPIMessage, GetSharedLevelMapPageAPIMessage}
import org.http4s.HttpRoutes
import org.http4s.dsl.io._

/** 玩家侧 UI 页面 HTTP 路由（挂载在 `/player` 前缀下）。
  *
  * GET /player/ui/level-map、GET /player/ui/pages/:pageId 由 ui 模块提供 PageConfig；
  * 与 player 模块的 data/actions 路由在 ApiRouter 层合并。
  */
object UiPlayerPageRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "ui" / "level-map" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetSharedLevelMapPageAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))

      case req @ GET -> Root / "ui" / "pages" / pageId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetPlayerUiPageAPIMessage(userId, pageId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))
    }
}
