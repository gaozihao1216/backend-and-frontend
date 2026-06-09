package microservice.bird.tables.skill_config.jdbc

import microservice.bird.tables.skill_config._

import java.sql.Connection

private[tables] object BirdSkillConfigTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS bird_skill_configs (
            bird_type TEXT PRIMARY KEY,
            skills_json TEXT NOT NULL,
            model_image_url TEXT,
            updated_by_id TEXT REFERENCES users(id),
            updated_at TEXT NOT NULL
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
