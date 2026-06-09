package microservice.player.tables.progress.jdbc

import microservice.player.tables.progress._

import java.sql.Connection

private[tables] object PlayerLevelProgressTableJdbcSchema {
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

private[tables] object PlayerLegacyCheckInTableJdbcSchema {
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
