package microservice.bird.tables

import io.circe.Json
import io.circe.parser.parse
import microservice.bird.objects.BirdSkillConfig
import java.sql.{Connection, PreparedStatement, ResultSet}
import java.time.Instant
import scala.collection.mutable

object BirdSkillConfigTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) BirdSkillConfigTableJdbc.initialize(connection)

  def listAll(connection: Connection): List[BirdSkillConfig] =
    if (isInMemory(connection)) BirdSkillConfigTableInMemory.listAll()
    else BirdSkillConfigTableJdbc.listAll(connection)

  def findByBirdType(connection: Connection, birdType: String): Option[BirdSkillConfig] =
    if (isInMemory(connection)) BirdSkillConfigTableInMemory.findByBirdType(birdType)
    else BirdSkillConfigTableJdbc.findByBirdType(connection, birdType)

  def upsert(connection: Connection, config: BirdSkillConfig): BirdSkillConfig =
    if (isInMemory(connection)) BirdSkillConfigTableInMemory.upsert(config)
    else BirdSkillConfigTableJdbc.upsert(connection, config)

  def skillsJsonMap(connection: Connection): Map[String, BirdSkillConfig] =
    listAll(connection).map(row => row.birdType -> row).toMap

  def nowIso: String = Instant.now().toString
}

private[tables] object BirdSkillConfigTableInMemory {
  private val store = mutable.Map.empty[String, BirdSkillConfig]

  def listAll(): List[BirdSkillConfig] = store.values.toList.sortBy(_.birdType)

  def findByBirdType(birdType: String): Option[BirdSkillConfig] = store.get(birdType)

  def upsert(config: BirdSkillConfig): BirdSkillConfig = {
    store.update(config.birdType, config)
    config
  }
}

private[tables] object BirdSkillConfigTableJdbc {
  def initialize(connection: Connection): Unit =
    BirdSkillConfigTableJdbcSchema.initialize(connection)

  def listAll(connection: Connection): List[BirdSkillConfig] = {
    val statement = connection.createStatement()
    try {
      val resultSet = statement.executeQuery(
        """
          SELECT bird_type, skills_json, model_image_url, updated_by_id, updated_at
          FROM bird_skill_configs
          ORDER BY bird_type ASC
        """
      )
      val rows = Iterator.continually(resultSet).takeWhile(_.next()).map(readRow).toList
      resultSet.close()
      rows
    } finally {
      statement.close()
    }
  }

  def findByBirdType(connection: Connection, birdType: String): Option[BirdSkillConfig] = {
    val statement = connection.prepareStatement(
      """
        SELECT bird_type, skills_json, model_image_url, updated_by_id, updated_at
        FROM bird_skill_configs
        WHERE bird_type = ?
      """
    )
    try {
      statement.setString(1, birdType)
      val resultSet = statement.executeQuery()
      val row =
        if (resultSet.next()) Some(readRow(resultSet))
        else None
      resultSet.close()
      row
    } finally {
      statement.close()
    }
  }

  def upsert(connection: Connection, config: BirdSkillConfig): BirdSkillConfig = {
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
      bindConfig(statement, config)
      statement.executeUpdate()
      config
    } finally {
      statement.close()
    }
  }

  private def readRow(resultSet: ResultSet): BirdSkillConfig = {
    val skillsRaw = resultSet.getString("skills_json")
    BirdSkillConfig(
      birdType = resultSet.getString("bird_type"),
      skills = parse(skillsRaw).getOrElse(Json.obj()),
      modelImageUrl = Option(resultSet.getString("model_image_url")),
      updatedById = Option(resultSet.getString("updated_by_id")),
      updatedAt = resultSet.getString("updated_at")
    )
  }

  private def bindConfig(statement: PreparedStatement, config: BirdSkillConfig): Unit = {
    statement.setString(1, config.birdType)
    statement.setString(2, config.skills.noSpacesSortKeys)
    statement.setString(3, config.modelImageUrl.orNull)
    statement.setString(4, config.updatedById.orNull)
    statement.setString(5, config.updatedAt)
  }
}
