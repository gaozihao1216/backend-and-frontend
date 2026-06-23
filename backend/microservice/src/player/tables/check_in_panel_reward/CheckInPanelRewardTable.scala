/**
  *
   * 定义：CheckInPanelRewardTable 表访问门面，connection==null 走 in-memory，否则 JDBC。
 * 问题：player 持久化需双后端一致 API，避免 APIMessage 分支存储逻辑。
 * 作用：initialize/list/find/insert/update 等统一入口。
 * 关联：[[DatabaseSession]]；inmemory 与 jdbc 子包实现。
 */
package microservice.player.tables.check_in_panel_reward

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.player.objects.CheckInSlotReward
import microservice.player.runtime.PlayerRuntimeDefaults
import microservice.player.tables.check_in_panel_reward.jdbc.CheckInPanelRewardTableJdbc

object CheckInPanelRewardTable {
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) CheckInPanelRewardTableJdbc.initialize(connection)
    else seedDefaultsInMemory()

  def listByPanelId(connection: Connection, panelId: String): Vector[CheckInSlotReward] = {
    val rows =
      if (TableConnection.isInMemory(connection)) {
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
      } else {
        CheckInPanelRewardTableJdbc.listByPanelId(connection, panelId)
      }
    rows.sortBy(_.slotIndex).map(row => CheckInSlotReward(row.coins, row.gems, row.fragments))
  }

  def replacePanelRewards(connection: Connection, panelId: String, rewards: Vector[CheckInSlotReward]): Unit =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.checkInPanelRewards = InMemoryStore.checkInPanelRewards.updated(panelId, rewards)
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
      CheckInPanelRewardTableJdbc.replacePanelRewards(connection, panelId, rows)
    }

  private def seedDefaultsInMemory(): Unit = {
    if (!InMemoryStore.checkInPanelRewards.contains(PlayerRuntimeDefaults.roleHomeCheckInPanelId)) {
      replacePanelRewards(
        null,
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
