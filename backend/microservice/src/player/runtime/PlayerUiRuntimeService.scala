package microservice.player.runtime

import microservice.infrastructure.http.HttpError
import microservice.player.tables.PlayerLegacyCheckInTable
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection

object PlayerUiRuntimeService {
  private val LegacyCheckInDataKey = "player.checkIn"
  private val LegacyCheckInClaimActionKey = "player.checkIn.claim"

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
