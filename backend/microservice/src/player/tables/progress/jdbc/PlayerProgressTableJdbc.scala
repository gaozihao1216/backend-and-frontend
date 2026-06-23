package microservice.player.tables.progress.jdbc

import java.sql.Connection
import microservice.player.tables.progress._

private[tables] object PlayerLevelProgressTableJdbc {
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

  def listByUserId(connection: Connection, userId: String): Vector[PlayerLevelProgressRow] = {
    val statement = connection.prepareStatement(
      s"${PlayerLevelProgressTableCodec.baseSelect} WHERE user_id = ? ORDER BY level_suffix ASC"
    )
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        val builder = Vector.newBuilder[PlayerLevelProgressRow]
        while (resultSet.next()) {
          builder += PlayerLevelProgressTableCodec.rowFromResultSet(resultSet)
        }
        builder.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

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

private[tables] object PlayerLegacyCheckInTableJdbc {
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

  def findByUserId(connection: Connection, userId: String): Option[PlayerLegacyCheckInRow] = {
    val statement = connection.prepareStatement(
      s"${PlayerLegacyCheckInTableCodec.baseSelect} WHERE user_id = ?"
    )
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(PlayerLegacyCheckInTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

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
