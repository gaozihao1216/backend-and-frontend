/** JDBC 读路径专用：SQL 列名 ↔ 签到面板奖励 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL snake_case 列对齐。
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
