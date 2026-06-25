package microservice.ui.objects.panelworkflows.request

import io.circe.Decoder
import io.circe.generic.semiauto._
import microservice.ui.objects.panelworkflows.UiCheckInSlotReward

/** PUT check-in-rewards 的请求对象；slots 语义见 [[UiCheckInSlotReward]]。 */
final case class RegisterCheckInPanelRewardsRequest(
  slots: Vector[UiCheckInSlotReward]
)

private[ui] object RegisterCheckInPanelRewardsRequest {
  implicit val registerCheckInPanelRewardsBodyDecoder: Decoder[RegisterCheckInPanelRewardsRequest] = deriveDecoder
}
