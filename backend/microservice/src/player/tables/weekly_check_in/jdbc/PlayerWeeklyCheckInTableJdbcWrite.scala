/** 每周签到表的 JDBC 写操作（INSERT/UPDATE/DELETE）。
  *
  * 实现：PreparedStatement + Codec.bindRow；写成功后必要时 re-read 返回最新行。
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
