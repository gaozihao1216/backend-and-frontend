package microservice.ui.support.mapping

import microservice.player.objects.checkin.CheckInSlotReward
import microservice.ui.objects.panelworkflows.UiCheckInSlotReward

/** player 模块 handoff 映射（仅 ui support 层引用 player 类型）。 */
private[ui] object PlayerHandoffMapping {
  def toCheckInSlotReward(slot: UiCheckInSlotReward): CheckInSlotReward =
    new CheckInSlotReward(coins = slot.coins, gems = slot.gems, fragments = slot.fragments)

  def toCheckInSlotRewards(slots: Vector[UiCheckInSlotReward]): Vector[CheckInSlotReward] =
    slots.map(toCheckInSlotReward)
}
