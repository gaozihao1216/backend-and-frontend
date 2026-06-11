package microservice.ui.api.panelworkflows

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.player.runtime.{CheckInSlotReward, PlayerWeeklyCheckInService}

/** PUT /admin/director/ui/panel-workflows/:panelId/check-in-rewards — 注册签到面板 7 格奖励。 */
final case class RegisterCheckInPanelRewardsAPIMessage(
  userId: String,
  panelId: String,
  slots: Vector[CheckInSlotReward]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    IO.blocking {
      PlayerWeeklyCheckInService.registerPanelRewards(connection, panelId, slots)
      Right(Json.obj("panelId" -> Json.fromString(panelId)))
    }
}
