package microservice.player.tables

final case class CheckInPanelRewardRow(
  panelId: String,
  slotIndex: Int,
  coins: Int,
  gems: Int,
  fragments: Int
)
