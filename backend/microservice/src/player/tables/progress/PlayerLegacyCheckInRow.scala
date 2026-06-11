/** 玩家进度表在存储层的行模型（与 PostgreSQL 表列一一对应）。
  *
  * 不直接作为 API 响应；经 RowMapper 转为 objects 包中的领域对象。
  */
package microservice.player.tables.progress

final case class PlayerLegacyCheckInRow(
  userId: String,
  status: String,
  updatedAt: String
)
