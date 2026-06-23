package microservice.routes

import cats.effect.IO
import io.circe.generic.auto._
import microservice.admin.routes.AdminApiMessages
import microservice.bird.routes.BirdApiMessages
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.api.{APIMessageRouter, RegisteredAPIMessage}
import microservice.infrastructure.api.RegisteredAPIMessage.publicApi
import microservice.level.routes.LevelApiMessages
import microservice.player.routes.PlayerApiMessages
import microservice.system.api.HealthAPIMessage
import microservice.system.objects.HealthResponse
import microservice.ui.routes.UiApiMessages
import microservice.user.routes.UserApiMessages
import org.http4s.HttpRoutes

/** 根路由挂载：将各业务模块的 APIMessage 注册到统一 RPC 入口。
  *
  * == 组装方式 ==
  * 外部业务 API 统一使用 `POST /api/{apiName}`。`apiName` 由 `XxxAPIMessage` 推导为
  * `xxxapi`，例如 `CreateLevelAPIMessage` → `createlevelapi`。
  *
  * == 公开 vs 受保护 ==
  * 公开接口使用 `RegisteredAPIMessage.publicApi` 注册；受保护接口使用
  * `protectedApi` 注册，并由统一分发器读取 `x-user-id` 后调用 `runAuthenticated`。
  *
  * == 与 Main 的关系 ==
  * `SystemDefaults.apiRoutes` 委托本对象的 `routes(databaseSession)`，
  * 由 [[microservice.Main]] 挂载到 Ember `withHttpApp`。
  */
object ApiRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    APIMessageRouter.routes(apiMessages, databaseSession)

  private val apiMessages: List[RegisteredAPIMessage] =
    List(publicApi[HealthAPIMessage, HealthResponse]()) ++
      UserApiMessages.apiMessages ++
      LevelApiMessages.apiMessages ++
      BirdApiMessages.apiMessages ++
      PlayerApiMessages.apiMessages ++
      AdminApiMessages.apiMessages ++
      UiApiMessages.apiMessages
}
