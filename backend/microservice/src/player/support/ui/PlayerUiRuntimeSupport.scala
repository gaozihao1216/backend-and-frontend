package microservice.player.support.ui

import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.tables.progress.legacy_check_in.PlayerLegacyCheckInTable
import microservice.player.support.checkin.PlayerWeeklyCheckInService
import microservice.player.support.progress.PlayerLevelProgressService
import microservice.player.support.shop.PlayerShopService
import microservice.player.support.wallet.PlayerWalletService

/** 动态 UI data/action 分派与 legacy 签到辅助。
  *
  * 按 apiKey 路由到各 Player*Service；未知 key 返回 404。
  */
private[player] object PlayerUiRuntimeSupport {
  private val LegacyCheckInDataKey = "player.checkIn"
  private val LegacyCheckInClaimActionKey = "player.checkIn.claim"

  /** 分派 UI data 请求并返回 JSON 载荷。 */
  def requireData(connection: Connection, userId: String, apiKey: String, params: Map[String, String]): Step[Json] =
    apiKey match {
      case PlayerWeeklyCheckInService.dataApiKey =>
        PlayerWeeklyCheckInService.requireData(connection, userId)
      case PlayerLevelProgressService.dataApiKey =>
        PlayerLevelProgressService.requireData(connection, userId)
      case PlayerWalletService.dataApiKey =>
        PlayerWalletService.requireData(connection, userId)
      case PlayerShopService.dataApiKey =>
        PlayerShopService.requireData(connection, userId, params)
      case LegacyCheckInDataKey =>
        PlanStep.succeed(Json.obj("status" -> Json.fromString(PlayerLegacyCheckInTable.getStatus(connection, userId))))
      case other =>
        PlanStep.fail(HttpError.notFound("UNKNOWN_UI_DATA_KEY", s"Unknown ui data key: $other"))
    }

  /** 分派 UI action 请求并返回 JSON 结果。 */
  def requireAction(connection: Connection, userId: String, apiKey: String, params: Map[String, String]): Step[Json] =
    apiKey match {
      case PlayerWeeklyCheckInService.claimActionKey =>
        PlayerWeeklyCheckInService.requireExecuteClaim(connection, userId, params)
      case PlayerShopService.purchaseActionKey =>
        PlayerShopService.requireExecutePurchase(connection, userId, params)
      case LegacyCheckInClaimActionKey =>
        PlayerLegacyCheckInTable.getStatus(connection, userId) match {
          case "ready" =>
            PlanStep.succeed(
              Json.obj(
                "status" -> Json.fromString(PlayerLegacyCheckInTable.setStatus(connection, userId, "claimed"))
              )
            )
          case status =>
            PlanStep.fail(HttpError.conflict("CHECK_IN_NOT_READY", s"Cannot claim check-in reward while status is $status"))
        }
      case other =>
        PlanStep.fail(HttpError.notFound("UNKNOWN_UI_ACTION_KEY", s"Unknown ui action key: $other"))
    }
}
