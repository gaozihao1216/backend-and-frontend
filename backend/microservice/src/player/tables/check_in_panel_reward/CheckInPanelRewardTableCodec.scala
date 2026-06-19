/**
  *
   * 定义：CheckInPanelRewardTableCodec：JDBC ResultSet ↔ Row 列映射与 baseSelect SQL 片段。
 * 问题：snake_case SQL 列名与 Scala camelCase 字段需集中转换。
 * 作用：baseSelect 复用；rowFromResultSet 解析枚举与 Option 列。
 * 关联：[[CheckInPanelRewardTableTableJdbcRead]] / [[CheckInPanelRewardTableTableJdbcWrite]] 共用。
 */
package microservice.player.tables.check_in_panel_reward

import java.sql.ResultSet

object CheckInPanelRewardTableCodec {
  val baseSelect: String =
    "SELECT panel_id, slot_index, coins, gems, fragments FROM check_in_panel_rewards"

  def rowFromResultSet(resultSet: ResultSet): CheckInPanelRewardRow =
    CheckInPanelRewardRow(
      panelId = resultSet.getString("panel_id"),
      slotIndex = resultSet.getInt("slot_index"),
      coins = resultSet.getInt("coins"),
      gems = resultSet.getInt("gems"),
      fragments = resultSet.getInt("fragments")
    )
}
