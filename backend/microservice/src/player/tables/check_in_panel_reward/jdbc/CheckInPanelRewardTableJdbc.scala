package microservice.player.tables.check_in_panel_reward.jdbc

import java.sql.Connection
import microservice.player.objects.CheckInSlotReward
import microservice.player.tables.check_in_panel_reward._

private[tables] object CheckInPanelRewardTableJdbc {
def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS check_in_panel_rewards (
            panel_id TEXT NOT NULL,
            slot_index INTEGER NOT NULL,
            coins INTEGER NOT NULL DEFAULT 0,
            gems INTEGER NOT NULL DEFAULT 0,
            fragments INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (panel_id, slot_index)
          )
        """
      )
      seedDefaultRewards(statement)
    } finally {
      statement.close()
    }
  }

  private def seedDefaultRewards(statement: java.sql.Statement): Unit = {
    val panelId = "player.home.checkIn"
    val rewards = Vector(
      (1, 10, 0, 0),
      (2, 15, 0, 0),
      (3, 20, 0, 1),
      (4, 30, 0, 0),
      (5, 35, 0, 2),
      (6, 40, 1, 0),
      (7, 50, 2, 5)
    )
    rewards.foreach { case (slot, coins, gems, fragments) =>
      statement.executeUpdate(
        s"""
          INSERT INTO check_in_panel_rewards (panel_id, slot_index, coins, gems, fragments)
          VALUES ('$panelId', $slot, $coins, $gems, $fragments)
          ON CONFLICT (panel_id, slot_index) DO NOTHING
        """
      )
    }
  }

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
