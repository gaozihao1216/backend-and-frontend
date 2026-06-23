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
        InMemoryStore.checkInPanelRewards.getOrElse(panelId, Vector.empty)
      } else {
        CheckInPanelRewardTableJdbc.listByPanelId(connection, panelId)
      }
    rows.sortBy(_.slotIndex).map(row => CheckInSlotReward(row.coins, row.gems, row.fragments))
  }

  def replacePanelRewards(connection: Connection, panelId: String, rewards: Vector[CheckInSlotReward]): Unit =
    if (TableConnection.isInMemory(connection)) {
      val rows = rewards.zipWithIndex.map { case (reward, index) =>
        CheckInPanelRewardRow(
          panelId = panelId,
          slotIndex = index + 1,
          coins = reward.coins,
          gems = reward.gems,
          fragments = reward.fragments
        )
      }
      InMemoryStore.checkInPanelRewards = InMemoryStore.checkInPanelRewards.updated(panelId, rows)
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
