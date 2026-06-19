package microservice.bird.tables.skill_config

/** BirdSkillConfigTable 表访问门面。
  *
  * 表职责：封装 birdskillconfig 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * inmemory/jdbc 双实现：connection == null 走 InMemoryStore，否则走 JDBC SQL。
  */
import microservice.bird.tables.skill_config.jdbc._

import microservice.bird.objects.skill.BirdSkillConfig
import java.sql.{Connection, PreparedStatement, ResultSet}
import java.time.Instant
import scala.collection.mutable

/** 鸟类技能配置表门面：按 birdType 存储 skills JSON 与模型图 URL。
  *
  * 实现：connection == null 时走 BirdSkillConfigTableInMemory；否则走 JDBC（PostgreSQL ON CONFLICT upsert）。
  * 关联：DirectorBirdSkillApi；玩家备战 PlayerPreparationCatalog 读取配置。
  */
object BirdSkillConfigTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** JDBC 模式下初始化 bird_skill_configs 表结构。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) BirdSkillConfigTableJdbc.initialize(connection)

  /** 列出全部技能配置，按 birdType 排序。 */
  def listAll(connection: Connection): List[BirdSkillConfig] =
    if (isInMemory(connection)) BirdSkillConfigTableInMemory.listAll().map(BirdSkillConfigRowMapper.toBirdSkillConfig)
    else BirdSkillConfigTableJdbc.listAll(connection).map(BirdSkillConfigRowMapper.toBirdSkillConfig)

  /** 按 birdType 查询单条配置。 */
  def findByBirdType(connection: Connection, birdType: String): Option[BirdSkillConfig] =
    if (isInMemory(connection)) BirdSkillConfigTableInMemory.findByBirdType(birdType).map(BirdSkillConfigRowMapper.toBirdSkillConfig)
    else BirdSkillConfigTableJdbc.findByBirdType(connection, birdType).map(BirdSkillConfigRowMapper.toBirdSkillConfig)

  /** 插入或更新技能配置（按 birdType 唯一键 upsert）。 */
  def upsert(connection: Connection, config: BirdSkillConfig): BirdSkillConfig = {
    val row = BirdSkillConfigRowMapper.fromBirdSkillConfig(config)
    val saved =
      if (isInMemory(connection)) BirdSkillConfigTableInMemory.upsert(row)
      else BirdSkillConfigTableJdbc.upsert(connection, row)
    BirdSkillConfigRowMapper.toBirdSkillConfig(saved)
  }

  /** 将全部配置转为 birdType → BirdSkillConfig 映射，供 buildBoard 快速查找。 */
  def skillsJsonMap(connection: Connection): Map[String, BirdSkillConfig] =
    listAll(connection).map(row => row.birdType -> row).toMap

  /** 当前 UTC 时间 ISO-8601 字符串，用于 updatedAt 字段。 */
  def nowIso: String = Instant.now().toString
}

private[tables] object BirdSkillConfigTableInMemory {
  private val store = mutable.Map.empty[String, BirdSkillConfigRow]

  def listAll(): List[BirdSkillConfigRow] = store.values.toList.sortBy(_.birdType)

  def findByBirdType(birdType: String): Option[BirdSkillConfigRow] = store.get(birdType)

  def upsert(row: BirdSkillConfigRow): BirdSkillConfigRow = {
    store.update(row.birdType, row)
    row
  }
}

private[tables] object BirdSkillConfigTableJdbc {
  def initialize(connection: Connection): Unit =
    BirdSkillConfigTableJdbcSchema.initialize(connection)

  def listAll(connection: Connection): List[BirdSkillConfigRow] = {
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

  def findByBirdType(connection: Connection, birdType: String): Option[BirdSkillConfigRow] = {
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

  private def readRow(resultSet: ResultSet): BirdSkillConfigRow =
    BirdSkillConfigRow(
      birdType = resultSet.getString("bird_type"),
      skillsJson = resultSet.getString("skills_json"),
      modelImageUrl = Option(resultSet.getString("model_image_url")),
      updatedById = Option(resultSet.getString("updated_by_id")),
      updatedAt = resultSet.getString("updated_at")
    )

  private def bindRow(statement: PreparedStatement, row: BirdSkillConfigRow): Unit = {
    statement.setString(1, row.birdType)
    statement.setString(2, row.skillsJson)
    statement.setString(3, row.modelImageUrl.orNull)
    statement.setString(4, row.updatedById.orNull)
    statement.setString(5, row.updatedAt)
  }
}
