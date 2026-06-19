package microservice.level.routes

import cats.effect.IO
import cats.syntax.semigroupk._
import microservice.infrastructure.database.DatabaseSession
import microservice.player.routes.{PlayerPreparationRouter, PlayerSocialRouter, PlayerUiRuntimeRouter}
import org.http4s.HttpRoutes

/** /player 前缀下的路由聚合器。
  *
  * HTTP 职责：用 `<+>` 合并关卡读/写、UI 运行时、社交、备战等子 router；本 object 不处理具体请求。
  * 挂载路径：ApiRouter 挂载在 `/player` 前缀下。
  * 为何不写业务逻辑：各子 router 仅做 HTTP 解析，业务在 APIMessage.plan 中。
  */
object PlayerLevelRouter {
  /** 组合玩家侧全部子路由；关卡相关部分由 Read/Action router 提供。 */
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    PlayerLevelReadRouter.routes(databaseSession) <+>
      PlayerLevelActionRouter.routes(databaseSession) <+>
      PlayerUiRuntimeRouter.routes(databaseSession) <+>
      PlayerSocialRouter.routes(databaseSession) <+>
      PlayerPreparationRouter.routes(databaseSession)
}
