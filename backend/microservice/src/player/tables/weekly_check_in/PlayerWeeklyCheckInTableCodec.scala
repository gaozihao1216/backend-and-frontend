package microservice.player.tables.weekly_check_in

import java.sql.ResultSet

object PlayerWeeklyCheckInTableCodec {
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
