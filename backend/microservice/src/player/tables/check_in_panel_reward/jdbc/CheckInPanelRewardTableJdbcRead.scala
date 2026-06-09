package microservice.player.tables.check_in_panel_reward.jdbc

import microservice.player.tables.check_in_panel_reward._

import java.sql.Connection

private[tables] object CheckInPanelRewardTableJdbcRead {
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
}
