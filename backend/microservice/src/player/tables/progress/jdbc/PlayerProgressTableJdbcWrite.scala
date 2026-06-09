package microservice.player.tables.progress.jdbc

import microservice.player.tables.progress._

import java.sql.Connection

private[tables] object PlayerLevelProgressTableJdbcWrite {
  def insert(connection: Connection, row: PlayerLevelProgressRow): PlayerLevelProgressRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_level_progress (user_id, level_suffix, cleared_at)
        VALUES (?, ?, ?)
        ON CONFLICT (user_id, level_suffix) DO NOTHING
      """
    )
    try {
      statement.setString(1, row.userId)
      statement.setString(2, row.levelSuffix)
      statement.setString(3, row.clearedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}

private[tables] object PlayerLegacyCheckInTableJdbcWrite {
  def upsert(connection: Connection, row: PlayerLegacyCheckInRow): PlayerLegacyCheckInRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_legacy_check_ins (user_id, status, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT (user_id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      """
    )
    try {
      statement.setString(1, row.userId)
      statement.setString(2, row.status)
      statement.setString(3, row.updatedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}
