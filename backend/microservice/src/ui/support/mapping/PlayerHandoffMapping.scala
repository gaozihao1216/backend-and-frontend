package microservice.ui.support.mapping

import microservice.player.objects.CheckInSlotReward
import microservice.ui.objects.panelworkflows.UiCheckInSlotReward

/** player 模块 handoff 映射（仅 ui support 层引用 player 类型）。 */
object PlayerHandoffMapping {
  def toCheckInSlotReward(slot: UiCheckInSlotReward): CheckInSlotReward =
    CheckInSlotReward(coins = slot.coins, gems = slot.gems, fragments = slot.fragments)

  def toCheckInSlotRewards(slots: Vector[UiCheckInSlotReward]): Vector[CheckInSlotReward] =
    slots.map(toCheckInSlotReward)
}
