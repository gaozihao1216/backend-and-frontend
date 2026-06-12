package microservice.player.api.ui

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.runtime.{
  PlayerShopService,
  PlayerWeeklyCheckInService
}
import microservice.player.tables.progress.PlayerLegacyCheckInTable
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** POST /player/ui/actions/:apiKey — 执行动态页面交互动作。 */
final case class InvokePlayerUiActionAPIMessage(
  userId: String,
  apiKey: String,
  params: Map[String, String]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, userId, UserRole.Player).map(_ => ()))
        payload <- apiKey match {
          case PlayerWeeklyCheckInService.claimActionKey =>
            PlanSteps.require(PlayerWeeklyCheckInService.executeClaim(connection, userId, params))
          case PlayerShopService.purchaseActionKey =>
            PlanSteps.require(PlayerShopService.executePurchase(connection, userId, params))
          case InvokePlayerUiActionAPIMessage.LegacyCheckInClaimActionKey =>
            PlanSteps.require(
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
            )
          case other =>
            PlanSteps.require[Json](Left(HttpError.notFound("UNKNOWN_UI_ACTION_KEY", s"Unknown ui action key: $other")))
        }
      } yield payload
    }
}

object InvokePlayerUiActionAPIMessage {
  private val LegacyCheckInClaimActionKey = "player.checkIn.claim"
}
