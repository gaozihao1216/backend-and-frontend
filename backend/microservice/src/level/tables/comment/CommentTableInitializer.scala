package microservice.level.tables.comment

import java.sql.Connection

object CommentTableInitializer {
  def initialize(connection: Connection): Unit = {
      val statement = connection.createStatement()
      try {
        statement.executeUpdate(
          """
            CREATE TABLE IF NOT EXISTS comments (
              id TEXT PRIMARY KEY,
              level_id TEXT NOT NULL REFERENCES levels(id),
              user_id TEXT NOT NULL REFERENCES users(id),
              content TEXT NOT NULL,
              created_at TEXT NOT NULL
            )
          """
        )
      } finally {
        statement.close()
      }
    }
}
