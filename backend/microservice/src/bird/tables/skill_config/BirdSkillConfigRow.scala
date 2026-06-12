/** 鸟类技能配置表在存储层的行模型（与 PostgreSQL 表列一一对应）。
  *
  * 不直接作为 API 响应；经 RowMapper 转为 objects 包中的领域对象。
  */
package microservice.bird.tables.skill_config

final case class BirdSkillConfigRow(
  birdType: String,
  skillsJson: String,
  modelImageUrl: Option[String],
  updatedById: Option[String],
  updatedAt: String
)
