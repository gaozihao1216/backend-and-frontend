package microservice.player.tables.progress.level_progress

import java.sql.Connection

object PlayerLevelProgressTableInitializer {
    def initialize(connection: Connection): Unit = {
      val statement = connection.createStatement()
      try {
        statement.executeUpdate(
          """
            CREATE TABLE IF NOT EXISTS player_level_progress (
              user_id TEXT NOT NULL REFERENCES users(id),
              level_suffix TEXT NOT NULL,
              cleared_at TEXT NOT NULL,
              PRIMARY KEY (user_id, level_suffix)
            )
          """
        )
        statement.executeUpdate(
          """
            INSERT INTO player_level_progress (user_id, level_suffix, cleared_at)
            VALUES ('player-1', 'level01', '2026-06-03T00:00:00Z')
            ON CONFLICT (user_id, level_suffix) DO NOTHING
          """
        )
      } finally {
        statement.close()
      }
    }
}
