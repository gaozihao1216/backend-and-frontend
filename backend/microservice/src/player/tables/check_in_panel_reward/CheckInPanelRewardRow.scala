package microservice.player.tables.check_in_panel_reward

final case class CheckInPanelRewardRow(
  panelId: String,
  slotIndex: Int,
  coins: Int,
  gems: Int,
  fragments: Int
)
