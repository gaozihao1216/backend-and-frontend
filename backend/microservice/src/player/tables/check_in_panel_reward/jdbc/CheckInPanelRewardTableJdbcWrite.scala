/** 签到面板奖励表的 JDBC 写操作（INSERT/UPDATE/DELETE）。
  *
  * 实现：PreparedStatement + Codec.bindRow；写成功后必要时 re-read 返回最新行。
  */
package microservice.player.tables.check_in_panel_reward.jdbc

import microservice.player.tables.check_in_panel_reward._

import java.sql.Connection

private[tables] object CheckInPanelRewardTableJdbcWrite {
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
