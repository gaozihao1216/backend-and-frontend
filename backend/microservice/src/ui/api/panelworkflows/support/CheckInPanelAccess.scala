package microservice.ui.api.panelworkflows.support

import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.objects.CheckInSlotReward

/** 签到面板奖励注册的前置校验。 */
private[panelworkflows] object CheckInPanelAccess {
  def requireCheckInRewards(panelId: String, slots: Vector[CheckInSlotReward]): Step[Unit] =
    PlanStep.fromEither(checkCheckInRewards(panelId, slots))

  def checkCheckInRewards(panelId: String, slots: Vector[CheckInSlotReward]): Either[HttpError, Unit] =
    if (panelId.trim.isEmpty) {
      Left(HttpError.badRequest("INVALID_PANEL", "panelId is required"))
    } else if (slots.size != 7) {
      Left(HttpError.badRequest("INVALID_SLOTS", "Exactly 7 slot rewards are required"))
    } else {
      Right(())
    }
}
