/** 签到面板奖励表在存储层的行模型（与 PostgreSQL 表列一一对应）。
  *
  * 不直接作为 API 响应；经 RowMapper 转为 objects 包中的领域对象。
  */
package microservice.player.tables.check_in_panel_reward

final case class CheckInPanelRewardRow(
  panelId: String,
  slotIndex: Int,
  coins: Int,
  gems: Int,
  fragments: Int
)
