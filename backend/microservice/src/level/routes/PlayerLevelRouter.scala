package microservice.level.routes

import cats.effect.IO
import cats.syntax.semigroupk._
import microservice.infrastructure.database.DatabaseSession
import org.http4s.HttpRoutes

/** /player 前缀下的关卡路由聚合器（仅 level 模块职责）。
  *
  * 社交、备战、UI 运行时、UI 页面等子路由由 [[microservice.routes.ApiRouter]] 在 `/player` 下合并挂载。
  */
object PlayerLevelRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    PlayerLevelReadRouter.routes(databaseSession) <+>
      PlayerLevelActionRouter.routes(databaseSession)
}
