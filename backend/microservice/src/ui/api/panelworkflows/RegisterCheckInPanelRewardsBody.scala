package microservice.ui.api.panelworkflows

import io.circe.Decoder
import io.circe.generic.semiauto._

/** 签到面板单格奖励 DTO（coins/gems/fragments）。
  *
  * 定义：RegisterCheckInPanelRewardsBody.slots 的单个元素。
  * 关联：player CheckInSlotReward 映射来源。
  */
final case class CheckInRewardSlotBody(
  coins: Int,
  gems: Int,
  fragments: Int
)

/** PUT check-in-rewards 的请求体。
  *
  * 定义：JSON body 含恰好 7 个 CheckInRewardSlotBody。
  * 关联：RegisterCheckInPanelRewardsAPIMessage；DirectorWorkbench 签到面板配置。
  */
final case class RegisterCheckInPanelRewardsBody(
  slots: Vector[CheckInRewardSlotBody]
)

object RegisterCheckInPanelRewardsBody {
  /** CheckInRewardSlotBody 单格奖励解码器。 */
  implicit val checkInRewardSlotDecoder: Decoder[CheckInRewardSlotBody] = deriveDecoder
  /** 请求体解码器。 */
  implicit val registerCheckInPanelRewardsBodyDecoder: Decoder[RegisterCheckInPanelRewardsBody] = deriveDecoder
}
