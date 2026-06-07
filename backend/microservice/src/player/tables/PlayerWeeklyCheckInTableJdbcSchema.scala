package microservice.player.tables

import java.sql.Connection

private[tables] object PlayerWeeklyCheckInTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS player_weekly_check_ins (
            user_id TEXT NOT NULL REFERENCES users(id),
            week_key TEXT NOT NULL,
            signed_slots TEXT NOT NULL DEFAULT '',
            signed_today BOOLEAN NOT NULL DEFAULT FALSE,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (user_id, week_key)
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
