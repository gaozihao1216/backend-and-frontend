package microservice.player.api.internal.ui

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanStep, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.checkin.CheckInSlotReward
import microservice.player.tables.check_in_panel_reward.CheckInPanelRewardTable

/** 模块间 API：注册签到面板 7 格奖励；由 ui HTTP API 调用，不挂路由。 */
final case class RegisterCheckInPanelRewardsInternalAPIMessage(
  panelId: String,
  slots: Vector[CheckInSlotReward]
) extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      if (panelId.trim.isEmpty) {
        PlanStep.fail(HttpError.badRequest("INVALID_PANEL", "panelId is required"))
      } else if (slots.size != 7) {
        PlanStep.fail(HttpError.badRequest("INVALID_SLOTS", "Exactly 7 slot rewards are required"))
      } else {
        CheckInPanelRewardTable.replacePanelRewards(connection, panelId, slots)
        PlanStep.succeed(())
      }
    }
}
