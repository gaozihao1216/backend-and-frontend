/**
  *
   * 定义：CheckInPanelRewardTableInMemory：InMemoryStore 上的 CheckInPanelRewardTable CRUD。
 * 问题：UGC_DATABASE_MODE 非 jdbc 时 connection=null，需内存向量/Map 模拟表。
 * 作用：与 JDBC 实现同签名，供 Table 门面透明切换。
 * 关联：[[InMemoryStore]]；[[CheckInPanelRewardTable]] isInMemory 分支。
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
