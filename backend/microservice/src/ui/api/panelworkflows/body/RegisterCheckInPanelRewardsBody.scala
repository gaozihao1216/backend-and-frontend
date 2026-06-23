package microservice.ui.api.panelworkflows.body

import io.circe.Decoder
import io.circe.generic.semiauto._
import microservice.player.objects.CheckInSlotReward

/** PUT check-in-rewards 的请求体；slots 语义见 [[CheckInSlotReward]]。 */
final case class RegisterCheckInPanelRewardsBody(
  slots: Vector[CheckInSlotReward]
)

object RegisterCheckInPanelRewardsBody {
  implicit val registerCheckInPanelRewardsBodyDecoder: Decoder[RegisterCheckInPanelRewardsBody] = deriveDecoder
}
