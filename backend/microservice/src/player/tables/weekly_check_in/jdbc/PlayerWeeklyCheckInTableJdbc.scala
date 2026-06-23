package microservice.player.tables.weekly_check_in.jdbc

import java.sql.Connection
import microservice.player.tables.weekly_check_in._

private[tables] object PlayerWeeklyCheckInTableJdbc {
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

def findByUserAndWeek(connection: Connection, userId: String, weekKey: String): Option[PlayerWeeklyCheckInRow] = {
    val statement =
      connection.prepareStatement(s"${PlayerWeeklyCheckInTableCodec.baseSelect} WHERE user_id = ? AND week_key = ?")
    try {
      statement.setString(1, userId)
      statement.setString(2, weekKey)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(PlayerWeeklyCheckInTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

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
