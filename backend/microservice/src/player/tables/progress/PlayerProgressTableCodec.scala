package microservice.player.tables.progress

import java.sql.ResultSet

object PlayerLevelProgressTableCodec {
  val baseSelect: String =
    "SELECT user_id, level_suffix, cleared_at FROM player_level_progress"

  def rowFromResultSet(resultSet: ResultSet): PlayerLevelProgressRow =
    PlayerLevelProgressRow(
      userId = resultSet.getString("user_id"),
      levelSuffix = resultSet.getString("level_suffix"),
      clearedAt = resultSet.getString("cleared_at")
    )
}

object PlayerLegacyCheckInTableCodec {
  val baseSelect: String =
    "SELECT user_id, status, updated_at FROM player_legacy_check_ins"

  def rowFromResultSet(resultSet: ResultSet): PlayerLegacyCheckInRow =
    PlayerLegacyCheckInRow(
      userId = resultSet.getString("user_id"),
      status = resultSet.getString("status"),
      updatedAt = resultSet.getString("updated_at")
    )
}
