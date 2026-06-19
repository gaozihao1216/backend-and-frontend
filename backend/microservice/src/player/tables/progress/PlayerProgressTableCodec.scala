/**
  *
   * 定义：PlayerProgressTableCodec：JDBC ResultSet ↔ Row 列映射与 baseSelect SQL 片段。
 * 问题：snake_case SQL 列名与 Scala camelCase 字段需集中转换。
 * 作用：baseSelect 复用；rowFromResultSet 解析枚举与 Option 列。
 * 关联：[[PlayerProgressTableTableJdbcRead]] / [[PlayerProgressTableTableJdbcWrite]] 共用。
 */
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
