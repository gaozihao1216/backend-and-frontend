package microservice.player.tables.preparation

import java.sql.Connection

object PlayerPreparationTableInitializer {
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
}
