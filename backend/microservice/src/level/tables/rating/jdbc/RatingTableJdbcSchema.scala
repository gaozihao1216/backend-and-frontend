package microservice.level.tables.rating.jdbc

import microservice.level.tables.shared.RatingRow

import microservice.level.tables.rating._

import java.sql.Connection

private[tables] object RatingTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS ratings (
            id TEXT PRIMARY KEY,
            level_id TEXT NOT NULL REFERENCES levels(id),
            player_id TEXT NOT NULL REFERENCES users(id),
            score INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE (level_id, player_id)
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
