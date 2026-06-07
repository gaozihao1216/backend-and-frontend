package microservice.ui.api.panelworkflows

import io.circe.Decoder
import io.circe.generic.semiauto._

final case class CheckInRewardSlotBody(
  coins: Int,
  gems: Int,
  fragments: Int
)

final case class RegisterCheckInPanelRewardsBody(
  slots: Vector[CheckInRewardSlotBody]
)

object RegisterCheckInPanelRewardsBody {
  implicit val checkInRewardSlotDecoder: Decoder[CheckInRewardSlotBody] = deriveDecoder
  implicit val registerCheckInPanelRewardsBodyDecoder: Decoder[RegisterCheckInPanelRewardsBody] = deriveDecoder
}
