/** InMemoryStore 上的 签到面板奖励 CRUD；演示模式与单元测试使用。
  *
  * 关联：玩家模块 Table 门面在 connection == null 时委托到此实现。
  */
package microservice.player.tables.check_in_panel_reward.inmemory

import microservice.player.tables.check_in_panel_reward._

import microservice.infrastructure.database.InMemoryStore
import microservice.player.objects.CheckInSlotReward

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
