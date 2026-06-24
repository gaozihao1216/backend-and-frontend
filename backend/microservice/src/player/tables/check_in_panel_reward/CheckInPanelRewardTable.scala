package microservice.player.tables.check_in_panel_reward

import java.sql.Connection
import microservice.player.objects.CheckInSlotReward

private[player] object CheckInPanelRewardTable {

  def listByPanelId(connection: Connection, panelId: String): Vector[CheckInSlotReward] =
    CheckInPanelRewardTableSql
      .listByPanelId(connection, panelId)
      .sortBy(_.slotIndex)
      .map(row => CheckInSlotReward(row.coins, row.gems, row.fragments))

  def replacePanelRewards(connection: Connection, panelId: String, rewards: Vector[CheckInSlotReward]): Unit = {
    val rows = rewards.zipWithIndex.map { case (reward, index) =>
      CheckInPanelRewardRow(
        panelId = panelId,
        slotIndex = index + 1,
        coins = reward.coins,
        gems = reward.gems,
        fragments = reward.fragments
      )
    }
    CheckInPanelRewardTableSql.replacePanelRewards(connection, panelId, rows)
  }
}

import java.sql.Connection
import microservice.player.objects.CheckInSlotReward
import microservice.player.tables.check_in_panel_reward._

private[tables] object CheckInPanelRewardTableSql {

def listByPanelId(connection: Connection, panelId: String): Vector[CheckInPanelRewardRow] = {
    val statement =
      connection.prepareStatement(
        s"${CheckInPanelRewardTableCodec.baseSelect} WHERE panel_id = ? ORDER BY slot_index ASC"
      )
    try {
      statement.setString(1, panelId)
      val resultSet = statement.executeQuery()
      try {
        val builder = Vector.newBuilder[CheckInPanelRewardRow]
        while (resultSet.next()) {
          builder += CheckInPanelRewardTableCodec.rowFromResultSet(resultSet)
        }
        builder.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

def replacePanelRewards(connection: Connection, panelId: String, rows: Vector[CheckInPanelRewardRow]): Unit = {
    val deleteStatement = connection.prepareStatement("DELETE FROM check_in_panel_rewards WHERE panel_id = ?")
    try {
      deleteStatement.setString(1, panelId)
      deleteStatement.executeUpdate()
    } finally {
      deleteStatement.close()
    }

    val insertStatement = connection.prepareStatement(
      """
        INSERT INTO check_in_panel_rewards (panel_id, slot_index, coins, gems, fragments)
        VALUES (?, ?, ?, ?, ?)
      """
    )
    try {
      rows.foreach { row =>
        insertStatement.setString(1, row.panelId)
        insertStatement.setInt(2, row.slotIndex)
        insertStatement.setInt(3, row.coins)
        insertStatement.setInt(4, row.gems)
        insertStatement.setInt(5, row.fragments)
        insertStatement.addBatch()
      }
      insertStatement.executeBatch()
    } finally {
      insertStatement.close()
    }
  }
}
