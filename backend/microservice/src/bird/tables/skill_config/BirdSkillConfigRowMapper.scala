package microservice.bird.tables.skill_config

import io.circe.Json
import io.circe.parser.parse
import microservice.bird.objects.BirdSkillConfig

/** BirdSkillConfigRow ↔ BirdSkillConfig 映射。 */
object BirdSkillConfigRowMapper {
  def toBirdSkillConfig(row: BirdSkillConfigRow): BirdSkillConfig =
    BirdSkillConfig(
      birdType = row.birdType,
      skills = parse(row.skillsJson).getOrElse(Json.obj()),
      modelImageUrl = row.modelImageUrl,
      updatedById = row.updatedById,
      updatedAt = row.updatedAt
    )

  def fromBirdSkillConfig(config: BirdSkillConfig): BirdSkillConfigRow =
    BirdSkillConfigRow(
      birdType = config.birdType,
      skillsJson = config.skills.noSpacesSortKeys,
      modelImageUrl = config.modelImageUrl,
      updatedById = config.updatedById,
      updatedAt = config.updatedAt
    )
}
