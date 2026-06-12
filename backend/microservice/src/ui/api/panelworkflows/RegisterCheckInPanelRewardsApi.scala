package microservice.ui.api.panelworkflows

import cats.effect.IO
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.runtime.{CheckInSlotReward, PlayerWeeklyCheckInService}
import microservice.system.objects.AdminLevel
import microservice.user.utils.AccessControl

/** PUT /admin/director/ui/panel-workflows/:panelId/check-in-rewards — 注册签到面板 7 格奖励。 */
final case class RegisterCheckInPanelRewardsAPIMessage(
  userId: String,
  panelId: String,
  slots: Vector[CheckInSlotReward]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
        _ <- PlanSteps.require(
          if (panelId.trim.isEmpty) {
            Left(HttpError.badRequest("INVALID_PANEL", "panelId is required"))
          } else if (slots.size != 7) {
            Left(HttpError.badRequest("INVALID_SLOTS", "Exactly 7 slot rewards are required"))
          } else {
            Right(())
          }
        )
        _ <- PlanSteps.blocking(PlayerWeeklyCheckInService.registerPanelRewards(connection, panelId, slots))
      } yield Json.obj("panelId" -> Json.fromString(panelId))
    }
}
