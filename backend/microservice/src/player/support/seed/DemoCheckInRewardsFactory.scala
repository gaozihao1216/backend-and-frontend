package microservice.player.support.seed

import microservice.player.objects.checkin.CheckInSlotReward

/** 演示用签到奖励槽（player 模块内，供 system seed 调用）。 */
private[player] object DemoCheckInRewardsFactory {
  val roleHomePanelRewards: Vector[CheckInSlotReward] =
    Vector(
      CheckInSlotReward(10, 0, 0),
      CheckInSlotReward(15, 0, 0),
      CheckInSlotReward(20, 0, 1),
      CheckInSlotReward(30, 0, 0),
      CheckInSlotReward(35, 0, 2),
      CheckInSlotReward(40, 1, 0),
      CheckInSlotReward(50, 2, 5)
    )
}
