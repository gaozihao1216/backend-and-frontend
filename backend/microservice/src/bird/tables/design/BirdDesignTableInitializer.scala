package microservice.bird.tables.design

import java.sql.Connection

object BirdDesignTableInitializer {
  def initialize(connection: Connection): Unit = {
      val statement = connection.createStatement()
      try {
        statement.executeUpdate(
          """
            CREATE TABLE IF NOT EXISTS bird_designs (
              id TEXT PRIMARY KEY,
              author_id TEXT NOT NULL REFERENCES users(id),
              name TEXT NOT NULL,
              summary TEXT NOT NULL,
              skill_name TEXT NOT NULL,
              attack INTEGER NOT NULL,
              impact INTEGER NOT NULL,
              speed INTEGER NOT NULL,
              tier_skills_json TEXT NOT NULL,
              preview_image_url TEXT NOT NULL,
              mechanism_tags_json TEXT NOT NULL DEFAULT '[]',
              status TEXT NOT NULL,
              rejection_reason TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              published_at TEXT
            )
          """
        )
      } finally {
        statement.close()
      }
    }
}
