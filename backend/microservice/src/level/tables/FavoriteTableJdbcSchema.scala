package microservice.level.tables

import java.sql.Connection

private[tables] object FavoriteTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS favorites (
            id TEXT PRIMARY KEY,
            level_id TEXT NOT NULL REFERENCES levels(id),
            user_id TEXT NOT NULL REFERENCES users(id),
            created_at TEXT NOT NULL,
            UNIQUE (level_id, user_id)
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
