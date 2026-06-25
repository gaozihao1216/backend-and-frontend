package microservice.player.objects.checkin

/** 周签到单个格子的奖励配置（coins / gems / fragments）。
  *
  * 总监通过 panel-workflows 注册恰好 7 格；玩家签到运行时按 slotIndex 读取。
  * 关联：CheckInPanelRewardTable；RegisterCheckInPanelRewardsAPIMessage。
  */
final case class CheckInSlotReward(
  coins: Int = 0,
  gems: Int = 0,
  fragments: Int = 0
)

private[player] object CheckInSlotReward {
  import io.circe.generic.semiauto._
  implicit val encoder: io.circe.Encoder[CheckInSlotReward] = deriveEncoder
  implicit val decoder: io.circe.Decoder[CheckInSlotReward] = deriveDecoder
}
