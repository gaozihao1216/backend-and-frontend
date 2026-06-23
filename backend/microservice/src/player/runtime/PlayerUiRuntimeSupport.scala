package microservice.player.runtime

import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.tables.progress.legacy_check_in.PlayerLegacyCheckInTable

/** 动态 UI data/action 分派与 legacy 签到辅助。 */
object PlayerUiRuntimeSupport {
  private val LegacyCheckInDataKey = "player.checkIn"
  private val LegacyCheckInClaimActionKey = "player.checkIn.claim"

  def requireData(connection: Connection, userId: String, apiKey: String, params: Map[String, String]): Step[Json] =
    PlanStep.fromEither(checkData(connection, userId, apiKey, params))

  def requireAction(connection: Connection, userId: String, apiKey: String, params: Map[String, String]): Step[Json] =
    PlanStep.fromEither(checkAction(connection, userId, apiKey, params))

  def checkData(connection: Connection, userId: String, apiKey: String, params: Map[String, String]): Either[HttpError, Json] =
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

  def checkAction(connection: Connection, userId: String, apiKey: String, params: Map[String, String]): Either[HttpError, Json] =
    apiKey match {
      case PlayerWeeklyCheckInService.claimActionKey =>
        PlayerWeeklyCheckInService.executeClaim(connection, userId, params)
      case PlayerShopService.purchaseActionKey =>
        PlayerShopService.executePurchase(connection, userId, params)
      case LegacyCheckInClaimActionKey =>
        PlayerLegacyCheckInTable.getStatus(connection, userId) match {
          case "ready" =>
            Right(
              Json.obj(
                "status" -> Json.fromString(PlayerLegacyCheckInTable.setStatus(connection, userId, "claimed"))
              )
            )
          case status =>
            Left(HttpError.conflict("CHECK_IN_NOT_READY", s"Cannot claim check-in reward while status is $status"))
        }
      case other =>
        Left(HttpError.notFound("UNKNOWN_UI_ACTION_KEY", s"Unknown ui action key: $other"))
    }
}
