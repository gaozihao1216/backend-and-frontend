/**
  *
   * 定义：CheckInPanelRewardTable 表访问门面，connection==null 走 in-memory，否则 JDBC。
 * 问题：player 持久化需双后端一致 API，避免 APIMessage 分支存储逻辑。
 * 作用：initialize/list/find/insert/update 等统一入口。
 * 关联：[[DatabaseSession]]；inmemory 与 jdbc 子包实现。
 */
package microservice.player.tables.check_in_panel_reward

import microservice.player.tables.check_in_panel_reward.inmemory._
import microservice.player.tables.check_in_panel_reward.jdbc._

import microservice.infrastructure.database.InMemoryStore
import microservice.player.objects.CheckInSlotReward
import microservice.player.runtime.PlayerRuntimeDefaults
import java.sql.Connection

object CheckInPanelRewardTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) CheckInPanelRewardTableJdbcSchema.initialize(connection)
    else seedDefaultsInMemory()

  def listByPanelId(connection: Connection, panelId: String): Vector[CheckInSlotReward] = {
    val rows =
      if (isInMemory(connection)) CheckInPanelRewardTableInMemory.listByPanelId(panelId)
      else CheckInPanelRewardTableJdbcRead.listByPanelId(connection, panelId)
    rows.sortBy(_.slotIndex).map(row => CheckInSlotReward(row.coins, row.gems, row.fragments))
  }

  def replacePanelRewards(connection: Connection, panelId: String, rewards: Vector[CheckInSlotReward]): Unit =
    if (isInMemory(connection)) {
      CheckInPanelRewardTableInMemory.replacePanelRewards(panelId, rewards)
    } else {
      val rows = rewards.zipWithIndex.map { case (reward, index) =>
        CheckInPanelRewardRow(
          panelId = panelId,
          slotIndex = index + 1,
          coins = reward.coins,
          gems = reward.gems,
          fragments = reward.fragments
        )
      }
      CheckInPanelRewardTableJdbcWrite.replacePanelRewards(connection, panelId, rows)
    }

  private def seedDefaultsInMemory(): Unit = {
    if (!InMemoryStore.checkInPanelRewards.contains(PlayerRuntimeDefaults.roleHomeCheckInPanelId)) {
      CheckInPanelRewardTableInMemory.replacePanelRewards(
        PlayerRuntimeDefaults.roleHomeCheckInPanelId,
        Vector(
          CheckInSlotReward(10, 0, 0),
          CheckInSlotReward(15, 0, 0),
          CheckInSlotReward(20, 0, 1),
          CheckInSlotReward(30, 0, 0),
          CheckInSlotReward(35, 0, 2),
          CheckInSlotReward(40, 1, 0),
          CheckInSlotReward(50, 2, 5)
        )
      )
    }
  }
}
