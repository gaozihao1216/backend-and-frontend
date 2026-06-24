package microservice.player.support.checkin

import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.objects.CheckInSlotReward
import microservice.player.runtime.PlayerWeeklyCheckInService

/** 签到面板奖励注册的 player 模块内实现。 */
private[player] object CheckInPanelRewardSupport {
  def requireRegisterPanelRewards(
    connection: Connection,
    panelId: String,
    slots: Vector[CheckInSlotReward]
  ): Step[Unit] =
    if (panelId.trim.isEmpty) {
      PlanStep.fail(HttpError.badRequest("INVALID_PANEL", "panelId is required"))
    } else if (slots.size != 7) {
      PlanStep.fail(HttpError.badRequest("INVALID_SLOTS", "Exactly 7 slot rewards are required"))
    } else {
      PlayerWeeklyCheckInService.registerPanelRewards(connection, panelId, slots)
      PlanStep.succeed(())
    }
}
