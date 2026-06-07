package microservice.player.tables

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
