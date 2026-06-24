package microservice.bird.tables.skill_config

import java.sql.Connection
import java.time.Instant
import io.circe.Json
import io.circe.parser.parse
import microservice.bird.objects.skill.config.BirdSkillConfig

final case class BirdSkillConfigRow(
  birdType: String,
  skillsJson: String,
  modelImageUrl: Option[String],
  updatedById: Option[String],
  updatedAt: String
)

/** 鸟类技能配置表访问入口：只使用 JDBC 连接，事务由 APIMessage/DatabaseSession 统一管理。 */
object BirdSkillConfigTable {

  def listAll(connection: Connection): List[BirdSkillConfig] =
    BirdSkillConfigTableSql.listAll(connection).map(toBirdSkillConfig)

  def findByBirdType(connection: Connection, birdType: String): Option[BirdSkillConfig] =
    BirdSkillConfigTableSql.findByBirdType(connection, birdType).map(toBirdSkillConfig)

  def upsert(connection: Connection, config: BirdSkillConfig): BirdSkillConfig = {
    val row = fromBirdSkillConfig(config)
    toBirdSkillConfig(BirdSkillConfigTableSql.upsert(connection, row))
  }

  def skillsJsonMap(connection: Connection): Map[String, BirdSkillConfig] =
    listAll(connection).map(row => row.birdType -> row).toMap

  def nowIso: String =
    Instant.now().toString

  private[tables] def toBirdSkillConfig(row: BirdSkillConfigRow): BirdSkillConfig =
    BirdSkillConfig(
      birdType = row.birdType,
      skills = parse(row.skillsJson).getOrElse(Json.obj()),
      modelImageUrl = row.modelImageUrl,
      updatedById = row.updatedById,
      updatedAt = row.updatedAt
    )

  private[tables] def fromBirdSkillConfig(config: BirdSkillConfig): BirdSkillConfigRow =
    BirdSkillConfigRow(
      birdType = config.birdType,
      skillsJson = config.skills.noSpacesSortKeys,
      modelImageUrl = config.modelImageUrl,
      updatedById = config.updatedById,
      updatedAt = config.updatedAt
    )
}

import java.sql.Connection

private[tables] object BirdSkillConfigTableSql {
  private val baseSelect: String =
    """
      SELECT bird_type, skills_json, model_image_url, updated_by_id, updated_at
      FROM bird_skill_configs
    """

def listAll(connection: Connection): List[BirdSkillConfigRow] = {
    val statement = connection.createStatement()
    try {
      val resultSet = statement.executeQuery(
        s"""
          $baseSelect
          ORDER BY bird_type ASC
        """
      )
      val rows = Iterator.continually(resultSet).takeWhile(_.next()).map(rowFromResultSet).toList
      resultSet.close()
      rows
    } finally {
      statement.close()
    }
  }

  def findByBirdType(connection: Connection, birdType: String): Option[BirdSkillConfigRow] = {
    val statement = connection.prepareStatement(s"$baseSelect WHERE bird_type = ?")
    try {
      statement.setString(1, birdType)
      val resultSet = statement.executeQuery()
      val row =
        if (resultSet.next()) Some(rowFromResultSet(resultSet))
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
      bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  private def rowFromResultSet(resultSet: java.sql.ResultSet): BirdSkillConfigRow =
    BirdSkillConfigRow(
      birdType = resultSet.getString("bird_type"),
      skillsJson = resultSet.getString("skills_json"),
      modelImageUrl = Option(resultSet.getString("model_image_url")),
      updatedById = Option(resultSet.getString("updated_by_id")),
      updatedAt = resultSet.getString("updated_at")
    )

  private def bindRow(statement: java.sql.PreparedStatement, row: BirdSkillConfigRow): Unit = {
    statement.setString(1, row.birdType)
    statement.setString(2, row.skillsJson)
    statement.setString(3, row.modelImageUrl.orNull)
    statement.setString(4, row.updatedById.orNull)
    statement.setString(5, row.updatedAt)
  }

}
