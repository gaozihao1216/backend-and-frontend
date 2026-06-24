/**
  *
   * 定义：PlayerWeeklyCheckInTableCodec：JDBC ResultSet ↔ Row 列映射与 baseSelect SQL 片段。
 * 问题：snake_case SQL 列名与 Scala camelCase 字段需集中转换。
 * 作用：baseSelect 复用；rowFromResultSet 解析枚举与 Option 列。
 * 关联：PlayerWeeklyCheckInTable 共用。
 */
package microservice.player.tables.weekly_check_in

import java.sql.ResultSet

private[player] object PlayerWeeklyCheckInTableCodec {
  val baseSelect: String =
    "SELECT user_id, week_key, signed_slots, signed_today, updated_at FROM player_weekly_check_ins"

  def rowFromResultSet(resultSet: ResultSet): PlayerWeeklyCheckInRow =
    PlayerWeeklyCheckInRow(
      userId = resultSet.getString("user_id"),
      weekKey = resultSet.getString("week_key"),
      signedSlots = resultSet.getString("signed_slots"),
      signedToday = resultSet.getBoolean("signed_today"),
      updatedAt = resultSet.getString("updated_at")
    )
}
