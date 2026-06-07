package microservice.player.runtime

import microservice.infrastructure.database.InMemoryStore
import microservice.infrastructure.http.HttpError
import io.circe.Json
import io.circe.syntax._

object PlayerUiRuntimeService {
  private val LegacyCheckInDataKey = "player.checkIn"
  private val LegacyCheckInClaimActionKey = "player.checkIn.claim"

  def getData(userId: String, apiKey: String): Either[HttpError, Json] =
    apiKey match {
      case PlayerWeeklyCheckInService.dataApiKey =>
        PlayerWeeklyCheckInService.getData(userId)
      case PlayerLevelProgressService.dataApiKey =>
        PlayerLevelProgressService.getData(userId)
      case LegacyCheckInDataKey =>
        Right(Json.obj("status" -> Json.fromString(legacyCheckInStatus(userId))))
      case other =>
        Left(HttpError.notFound("UNKNOWN_UI_DATA_KEY", s"Unknown ui data key: $other"))
    }

  def executeAction(userId: String, apiKey: String, params: Map[String, String]): Either[HttpError, Json] =
    apiKey match {
      case PlayerWeeklyCheckInService.claimActionKey =>
        PlayerWeeklyCheckInService.executeClaim(userId, params)
      case LegacyCheckInClaimActionKey =>
        legacyCheckInStatus(userId) match {
          case "ready" =>
            InMemoryStore.playerCheckInStatus = InMemoryStore.playerCheckInStatus.updated(userId, "claimed")
            Right(Json.obj("status" -> Json.fromString("claimed")))
          case status =>
            Left(HttpError.conflict("CHECK_IN_NOT_READY", s"Cannot claim check-in reward while status is $status"))
        }
      case other =>
        Left(HttpError.notFound("UNKNOWN_UI_ACTION_KEY", s"Unknown ui action key: $other"))
    }

  private def legacyCheckInStatus(userId: String): String =
    InMemoryStore.playerCheckInStatus.getOrElse(userId, "ready")
}
