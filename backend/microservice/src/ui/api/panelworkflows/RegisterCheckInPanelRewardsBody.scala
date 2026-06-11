package microservice.ui.api.panelworkflows

import io.circe.Decoder
import io.circe.generic.semiauto._

/** 签到面板单格奖励（coins/gems/fragments）。 */
final case class CheckInRewardSlotBody(
  coins: Int,
  gems: Int,
  fragments: Int
)

/** PUT /admin/director/ui/panel-workflows/:panelId/check-in-rewards 的请求体（7 格奖励向量）。 */
final case class RegisterCheckInPanelRewardsBody(
  slots: Vector[CheckInRewardSlotBody]
)

object RegisterCheckInPanelRewardsBody {
  implicit val checkInRewardSlotDecoder: Decoder[CheckInRewardSlotBody] = deriveDecoder
  implicit val registerCheckInPanelRewardsBodyDecoder: Decoder[RegisterCheckInPanelRewardsBody] = deriveDecoder
}
