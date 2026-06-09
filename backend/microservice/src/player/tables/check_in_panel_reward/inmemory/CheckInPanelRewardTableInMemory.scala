package microservice.player.tables.check_in_panel_reward.inmemory

import microservice.player.tables.check_in_panel_reward._

import microservice.infrastructure.database.InMemoryStore
import microservice.player.runtime.CheckInSlotReward

private[tables] object CheckInPanelRewardTableInMemory {
  def listByPanelId(panelId: String): Vector[CheckInPanelRewardRow] =
    InMemoryStore.checkInPanelRewards
      .getOrElse(panelId, Vector.empty)
      .zipWithIndex
      .map { case (reward, index) =>
        CheckInPanelRewardRow(
          panelId = panelId,
          slotIndex = index + 1,
          coins = reward.coins,
          gems = reward.gems,
          fragments = reward.fragments
        )
      }

  def replacePanelRewards(panelId: String, rewards: Vector[CheckInSlotReward]): Unit =
    InMemoryStore.checkInPanelRewards = InMemoryStore.checkInPanelRewards.updated(panelId, rewards)
}
