package microservice.level.routes

import cats.effect.IO
import cats.syntax.semigroupk._
import microservice.infrastructure.database.DatabaseSession
import microservice.player.routes.{PlayerPreparationRouter, PlayerSocialRouter, PlayerUiRuntimeRouter}
import org.http4s.HttpRoutes

/** /player 前缀下的路由聚合。
  *
  * 实现：用 `<+>` 合并关卡读/写、UI 运行时、社交、备战等子 router。
  * 关联：前端 player-api、player-ui-api、player-social-api 等均代理到此前缀。
  */
object PlayerLevelRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    PlayerLevelReadRouter.routes(databaseSession) <+>
      PlayerLevelActionRouter.routes(databaseSession) <+>
      PlayerUiRuntimeRouter.routes(databaseSession) <+>
      PlayerSocialRouter.routes(databaseSession) <+>
      PlayerPreparationRouter.routes(databaseSession)
}
