package microservice.bird.tables.skill_config.jdbc

import java.sql.Connection
import microservice.bird.tables.skill_config._
import microservice.bird.tables.skill_config.{BirdSkillConfigRow, BirdSkillConfigTableCodec}

private[tables] object BirdSkillConfigTableJdbc {
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

def listAll(connection: Connection): List[BirdSkillConfigRow] = {
    val statement = connection.createStatement()
    try {
      val resultSet = statement.executeQuery(
        s"""
          ${BirdSkillConfigTableCodec.baseSelect}
          ORDER BY bird_type ASC
        """
      )
      val rows = Iterator.continually(resultSet).takeWhile(_.next()).map(BirdSkillConfigTableCodec.rowFromResultSet).toList
      resultSet.close()
      rows
    } finally {
      statement.close()
    }
  }

  def findByBirdType(connection: Connection, birdType: String): Option[BirdSkillConfigRow] = {
    val statement = connection.prepareStatement(s"${BirdSkillConfigTableCodec.baseSelect} WHERE bird_type = ?")
    try {
      statement.setString(1, birdType)
      val resultSet = statement.executeQuery()
      val row =
        if (resultSet.next()) Some(BirdSkillConfigTableCodec.rowFromResultSet(resultSet))
        else None
      resultSet.close()
      row
    } finally {
      statement.close()
    }
  }

def upsert(connection: Connection, row: BirdSkillConfigRow): BirdSkillConfigRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO bird_skill_configs (
          bird_type, skills_json, model_image_url, updated_by_id, updated_at
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(bird_type) DO UPDATE SET
          skills_json = excluded.skills_json,
          model_image_url = excluded.model_image_url,
          updated_by_id = excluded.updated_by_id,
          updated_at = excluded.updated_at
      """
    )
    try {
      BirdSkillConfigTableCodec.bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}
