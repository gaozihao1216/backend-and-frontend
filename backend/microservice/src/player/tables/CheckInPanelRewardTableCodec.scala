package microservice.player.tables

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
