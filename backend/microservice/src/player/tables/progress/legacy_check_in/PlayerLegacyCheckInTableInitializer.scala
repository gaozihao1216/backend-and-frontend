package microservice.player.tables.progress.legacy_check_in

import java.sql.Connection

object PlayerLegacyCheckInTableInitializer {
    def initialize(connection: Connection): Unit = {
      val statement = connection.createStatement()
      try {
        statement.executeUpdate(
          """
            CREATE TABLE IF NOT EXISTS player_legacy_check_ins (
              user_id TEXT PRIMARY KEY REFERENCES users(id),
              status TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          """
        )
      } finally {
        statement.close()
      }
    }
}
