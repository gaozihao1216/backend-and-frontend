package microservice.ui.body.panelworkflows

import io.circe.Decoder
import io.circe.generic.semiauto._
import microservice.ui.objects.panelworkflows.UiCheckInSlotReward

/** PUT check-in-rewards 的请求体；slots 语义见 [[UiCheckInSlotReward]]。 */
final case class RegisterCheckInPanelRewardsBody(
  slots: Vector[UiCheckInSlotReward]
)

private[ui] object RegisterCheckInPanelRewardsBody {
  implicit val registerCheckInPanelRewardsBodyDecoder: Decoder[RegisterCheckInPanelRewardsBody] = deriveDecoder
}
