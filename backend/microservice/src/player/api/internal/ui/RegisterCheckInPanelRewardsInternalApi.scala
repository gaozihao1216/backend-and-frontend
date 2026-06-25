package microservice.player.api.internal.ui

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.checkin.CheckInSlotReward
import microservice.player.support.checkin.CheckInPanelRewardSupport

/** 模块间 API：注册签到面板 7 格奖励；由 ui HTTP API 调用，不挂路由。 */
final case class RegisterCheckInPanelRewardsInternalAPIMessage(
  panelId: String,
  slots: Vector[CheckInSlotReward]
) extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      CheckInPanelRewardSupport.requireRegisterPanelRewards(connection, panelId, slots)
    }
}
