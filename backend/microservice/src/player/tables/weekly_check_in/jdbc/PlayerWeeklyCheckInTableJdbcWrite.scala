/**
  *
   * 定义：PlayerWeeklyCheckInTableJdbcWrite：PlayerWeeklyCheckInTable 表的 JDBC 写实现。
 * 问题：insert/update 需参数化 SQL 防注入且与 Row 字段一一对应。
 * 作用：INSERT/UPDATE/DELETE；写后必要时 re-read 返回最新 Row。
 * 关联：[[PlayerWeeklyCheckInTable]] 写路径分流；事务由 APIMessage.run 外层提交。
 */
package microservice.player.tables.weekly_check_in.jdbc

import microservice.player.tables.weekly_check_in._

import java.sql.Connection

private[tables] object PlayerWeeklyCheckInTableJdbcWrite {
  def upsert(connection: Connection, row: PlayerWeeklyCheckInRow): PlayerWeeklyCheckInRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_weekly_check_ins (user_id, week_key, signed_slots, signed_today, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (user_id, week_key) DO UPDATE SET
          signed_slots = EXCLUDED.signed_slots,
          signed_today = EXCLUDED.signed_today,
          updated_at = EXCLUDED.updated_at
      """
    )
    try {
      statement.setString(1, row.userId)
      statement.setString(2, row.weekKey)
      statement.setString(3, row.signedSlots)
      statement.setBoolean(4, row.signedToday)
      statement.setString(5, row.updatedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}
