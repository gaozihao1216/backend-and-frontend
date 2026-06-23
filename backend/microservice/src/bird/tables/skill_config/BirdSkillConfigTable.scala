package microservice.bird.tables.skill_config

import java.sql.Connection
import java.time.Instant
import microservice.bird.objects.skill.config.BirdSkillConfig
import microservice.bird.tables.skill_config.jdbc.BirdSkillConfigTableJdbc
import microservice.infrastructure.database.{InMemoryStore, TableConnection}

/** 鸟类技能配置表门面：按 birdType 存储 skills JSON 与模型图 URL。
  *
  * 实现：connection == null 时走 InMemoryStore；否则走 JDBC（PostgreSQL ON CONFLICT upsert）。
  * 关联：GetDirectorBirdSkillBoardAPIMessage 等；玩家备战 PlayerPreparationCatalog 读取配置。
  */
object BirdSkillConfigTable {
  /** JDBC 模式下初始化 bird_skill_configs 表结构。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) BirdSkillConfigTableJdbc.initialize(connection)

  /** 列出全部技能配置，按 birdType 排序。 */
  def listAll(connection: Connection): List[BirdSkillConfig] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.birdSkillConfigs.toList.sortBy(_.birdType).map(BirdSkillConfigRowMapper.toBirdSkillConfig)
    } else {
      BirdSkillConfigTableJdbc.listAll(connection).map(BirdSkillConfigRowMapper.toBirdSkillConfig)
    }

  /** 按 birdType 查询单条配置。 */
  def findByBirdType(connection: Connection, birdType: String): Option[BirdSkillConfig] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.birdSkillConfigs.find(_.birdType == birdType).map(BirdSkillConfigRowMapper.toBirdSkillConfig)
    } else {
      BirdSkillConfigTableJdbc.findByBirdType(connection, birdType).map(BirdSkillConfigRowMapper.toBirdSkillConfig)
    }

  /** 插入或更新技能配置（按 birdType 唯一键 upsert）。 */
  def upsert(connection: Connection, config: BirdSkillConfig): BirdSkillConfig = {
    val row = BirdSkillConfigRowMapper.fromBirdSkillConfig(config)
    val saved =
      if (TableConnection.isInMemory(connection)) {
        InMemoryStore.birdSkillConfigs =
          InMemoryStore.birdSkillConfigs.filterNot(_.birdType == row.birdType) :+ row
        row
      } else {
        BirdSkillConfigTableJdbc.upsert(connection, row)
      }
    BirdSkillConfigRowMapper.toBirdSkillConfig(saved)
  }

  /** 将全部配置转为 birdType → BirdSkillConfig 映射，供 buildBoard 快速查找。 */
  def skillsJsonMap(connection: Connection): Map[String, BirdSkillConfig] =
    listAll(connection).map(row => row.birdType -> row).toMap

  /** 当前 UTC 时间 ISO-8601 字符串，用于 updatedAt 字段。 */
  def nowIso: String = Instant.now().toString
}
