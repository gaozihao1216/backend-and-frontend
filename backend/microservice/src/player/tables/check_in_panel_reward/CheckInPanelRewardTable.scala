/** 签到面板奖励表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。
  *
  * 关联：玩家模块 APIMessage 通过此对象读写 签到面板奖励 数据。
  */
package microservice.player.tables.check_in_panel_reward

import microservice.player.tables.check_in_panel_reward.inmemory._
import microservice.player.tables.check_in_panel_reward.jdbc._

import microservice.infrastructure.database.InMemoryStore
import microservice.player.runtime.{CheckInSlotReward, PlayerRuntimeDefaults}
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
