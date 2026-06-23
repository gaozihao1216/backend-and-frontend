package microservice.ui.objects.panelworkflows

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 签到面板单格奖励（ui 模块自有 DTO，JSON 与 player.CheckInSlotReward 对齐）。 */
final case class UiCheckInSlotReward(
  coins: Int = 0,
  gems: Int = 0,
  fragments: Int = 0
)

private[ui] object UiCheckInSlotReward {
  implicit val encoder: Encoder[UiCheckInSlotReward] = deriveEncoder
  implicit val decoder: Decoder[UiCheckInSlotReward] = deriveDecoder
}
