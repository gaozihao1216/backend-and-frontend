/**
  *
   * 定义：CheckInPanelRewardTableJdbcRead：CheckInPanelRewardTable 表的 JDBC 只读实现。
 * 问题：门面 Table 在 connection!=null 时需 PreparedStatement 查询 PostgreSQL。
 * 作用：list/find/count 等 SELECT，ResultSet 经 Codec 转 Row。
 * 关联：[[CheckInPanelRewardTable]] 读路径分流；[[CheckInPanelRewardTableCodec]] rowFromResultSet。
 */
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
