package microservice.player.runtime

import microservice.infrastructure.http.HttpError
import microservice.player.tables.progress.PlayerLegacyCheckInTable
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection

/** 玩家 UI 运行时统一调度器：按 apiKey 分发数据查询与交互动作。
  *
  * 实现：将总监配置的 dataSource.apiKey / action.apiKey 路由到各子服务。
  * 关联：PlayerUiRuntimeRouter；子服务包括钱包、商店、周签到、关卡进度及遗留签到。
  */
object PlayerUiRuntimeService {
  private val LegacyCheckInDataKey = "player.checkIn"
  private val LegacyCheckInClaimActionKey = "player.checkIn.claim"

  /** 按 apiKey 拉取运行时 JSON 数据；未知 key 返回 404。 */
  def getData(connection: Connection, userId: String, apiKey: String, params: Map[String, String]): Either[HttpError, Json] =
    apiKey match {
      case PlayerWeeklyCheckInService.dataApiKey =>
        PlayerWeeklyCheckInService.getData(connection, userId)
      case PlayerLevelProgressService.dataApiKey =>
        PlayerLevelProgressService.getData(connection, userId)
      case PlayerWalletService.dataApiKey =>
        PlayerWalletService.getData(connection, userId)
      case PlayerShopService.dataApiKey =>
        PlayerShopService.getData(connection, userId, params)
      case LegacyCheckInDataKey =>
        Right(Json.obj("status" -> Json.fromString(PlayerLegacyCheckInTable.getStatus(connection, userId))))
      case other =>
        Left(HttpError.notFound("UNKNOWN_UI_DATA_KEY", s"Unknown ui data key: $other"))
    }

  /** 按 apiKey 执行交互动作（购买、签到领取等）；未知 key 返回 404。 */
  def executeAction(connection: Connection, userId: String, apiKey: String, params: Map[String, String]): Either[HttpError, Json] =
    apiKey match {
      case PlayerWeeklyCheckInService.claimActionKey =>
        PlayerWeeklyCheckInService.executeClaim(connection, userId, params)
      case PlayerShopService.purchaseActionKey =>
        PlayerShopService.executePurchase(connection, userId, params)
      case LegacyCheckInClaimActionKey =>
        PlayerLegacyCheckInTable.getStatus(connection, userId) match {
          case "ready" =>
            Right(Json.obj("status" -> Json.fromString(PlayerLegacyCheckInTable.setStatus(connection, userId, "claimed"))))
          case status =>
            Left(HttpError.conflict("CHECK_IN_NOT_READY", s"Cannot claim check-in reward while status is $status"))
        }
      case other =>
        Left(HttpError.notFound("UNKNOWN_UI_ACTION_KEY", s"Unknown ui action key: $other"))
    }
}
