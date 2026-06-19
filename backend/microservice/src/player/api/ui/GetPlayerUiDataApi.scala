package microservice.player.api.ui

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.runtime.{
  PlayerLevelProgressService,
  PlayerShopService,
  PlayerWalletService,
  PlayerWeeklyCheckInService
}
import microservice.player.tables.progress.PlayerLegacyCheckInTable
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** GET /player/ui/data/:apiKey 动态 UI 数据 APIMessage。
  *
  * 定义：userId + apiKey + query params，按 key 分派 RuntimeService.getData。
  * 问题：总监 UI 页面通过 apiKey 拉钱包/商店/签到/进度，不宜硬编码在 ui 模块。
  * 作用：requireRole(Player) → match apiKey → 返回 Circe Json 载荷。
  * 关联：[[PlayerUiRuntimeRouter]] GET data；[[PlayerWeeklyCheckInService.dataApiKey]] 等。
  */
final case class GetPlayerUiDataAPIMessage(
  userId: String,
  apiKey: String,
  params: Map[String, String]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // --- 1. 校验 Player 角色 ---
        _ <- PlanSteps.require(AccessControl.requireRole(connection, userId, UserRole.Player).map(_ => ()))
        // --- 2. 按 apiKey 分派到对应 RuntimeService ---
        payload <- apiKey match {
          case PlayerWeeklyCheckInService.dataApiKey =>
            PlanSteps.require(PlayerWeeklyCheckInService.getData(connection, userId))
          case PlayerLevelProgressService.dataApiKey =>
            PlanSteps.require(PlayerLevelProgressService.getData(connection, userId))
          case PlayerWalletService.dataApiKey =>
            PlanSteps.require(PlayerWalletService.getData(connection, userId))
          case PlayerShopService.dataApiKey =>
            PlanSteps.require(PlayerShopService.getData(connection, userId, params))
          case GetPlayerUiDataAPIMessage.LegacyCheckInDataKey =>
            PlanSteps.read(
              Json.obj("status" -> Json.fromString(PlayerLegacyCheckInTable.getStatus(connection, userId)))
            )
          case other =>
            PlanSteps.require[Json](Left(HttpError.notFound("UNKNOWN_UI_DATA_KEY", s"Unknown ui data key: $other")))
        }
      } yield payload
    }
}

object GetPlayerUiDataAPIMessage {
  private val LegacyCheckInDataKey = "player.checkIn"
}
