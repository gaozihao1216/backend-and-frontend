package microservice.player.tables.preparation.jdbc

import java.sql.Connection
import microservice.player.tables.preparation.{PlayerBirdUpgradeRow, PlayerPreparationTableCodec}

private[tables] object PlayerPreparationTableJdbc {
def initialize(connection: Connection, systemBirdTypes: Vector[String]): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS player_bird_upgrades (
            user_id TEXT NOT NULL REFERENCES users(id),
            bird_type TEXT NOT NULL,
            level INTEGER NOT NULL DEFAULT 1,
            tier INTEGER NOT NULL DEFAULT 1,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (user_id, bird_type)
          )
        """
      )
      statement.executeUpdate(
        "ALTER TABLE player_bird_upgrades ADD COLUMN IF NOT EXISTS tier INTEGER NOT NULL DEFAULT 1"
      )
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS player_slingshot_upgrades (
            user_id TEXT PRIMARY KEY REFERENCES users(id),
            level INTEGER NOT NULL DEFAULT 1,
            updated_at TEXT NOT NULL
          )
        """
      )
      systemBirdTypes.foreach { birdType =>
        statement.executeUpdate(
          s"""
            INSERT INTO player_bird_upgrades (user_id, bird_type, level, tier, updated_at)
            VALUES ('player-1', '$birdType', 1, 1, '2026-06-03T00:00:00Z')
            ON CONFLICT DO NOTHING
          """
        )
      }
      statement.executeUpdate(
        """
          INSERT INTO player_slingshot_upgrades (user_id, level, updated_at)
          VALUES ('player-1', 1, '2026-06-03T00:00:00Z')
          ON CONFLICT DO NOTHING
        """
      )
    } finally {
      statement.close()
    }
  }

def listBirdRows(connection: Connection, userId: String): Vector[PlayerBirdUpgradeRow] = {
    val statement = connection.prepareStatement(
      "SELECT bird_type, level, tier, updated_at FROM player_bird_upgrades WHERE user_id = ?"
    )
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        val builder = Vector.newBuilder[PlayerBirdUpgradeRow]
        while (resultSet.next()) {
          builder += PlayerPreparationTableCodec.birdRowFromResultSet(userId, resultSet)
        }
        builder.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def getSlingshotLevel(connection: Connection, userId: String): Int = {
    val statement = connection.prepareStatement(
      "SELECT level FROM player_slingshot_upgrades WHERE user_id = ?"
    )
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try if (resultSet.next()) resultSet.getInt("level") else 1
      finally resultSet.close()
    } finally {
      statement.close()
    }
  }

def insertBirdDefault(connection: Connection, userId: String, birdType: String, updatedAt: String): Unit = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_bird_upgrades (user_id, bird_type, level, tier, updated_at)
        VALUES (?, ?, 1, 1, ?)
        ON CONFLICT DO NOTHING
      """
    )
    try {
      statement.setString(1, userId)
      statement.setString(2, birdType)
      statement.setString(3, updatedAt)
      statement.executeUpdate()
    } finally {
      statement.close()
    }
  }

  def ensureSlingshotDefault(connection: Connection, userId: String, updatedAt: String): Unit = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_slingshot_upgrades (user_id, level, updated_at)
        VALUES (?, 1, ?)
        ON CONFLICT DO NOTHING
      """
    )
    try {
      statement.setString(1, userId)
      statement.setString(2, updatedAt)
      statement.executeUpdate()
    } finally {
      statement.close()
    }
  }

  def upsertBird(
    connection: Connection,
    userId: String,
    birdType: String,
    level: Int,
    tier: Int,
    updatedAt: String
  ): Unit = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_bird_upgrades (user_id, bird_type, level, tier, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (user_id, bird_type) DO UPDATE SET
          level = EXCLUDED.level,
          tier = EXCLUDED.tier,
          updated_at = EXCLUDED.updated_at
      """
    )
    try {
      statement.setString(1, userId)
      statement.setString(2, birdType)
      statement.setInt(3, level)
      statement.setInt(4, tier)
      statement.setString(5, updatedAt)
      statement.executeUpdate()
    } finally {
      statement.close()
    }
  }

  def upsertSlingshot(connection: Connection, userId: String, level: Int, updatedAt: String): Unit = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_slingshot_upgrades (user_id, level, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT (user_id) DO UPDATE SET
          level = EXCLUDED.level,
          updated_at = EXCLUDED.updated_at
      """
    )
    try {
      statement.setString(1, userId)
      statement.setInt(2, level)
      statement.setString(3, updatedAt)
      statement.executeUpdate()
    } finally {
      statement.close()
    }
  }
}
