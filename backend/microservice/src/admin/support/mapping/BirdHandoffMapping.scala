package microservice.admin.support.mapping

import microservice.admin.objects.bird._
import microservice.admin.objects.director.level_assignment.board.DirectorBirdPoolOption
import microservice.bird.objects.catalog.BirdPoolOptionEntry
import microservice.bird.objects.skill.config.BirdSkillConfig
import microservice.bird.objects.skill.director.{DirectorBirdSkillBoard, DirectorBirdSkillEntry}

/** bird 模块 handoff → admin DTO（仅 support 层引用 bird 类型）。 */
object BirdHandoffMapping {
  def toDirectorBirdSkillEntry(entry: DirectorBirdSkillEntry): AdminDirectorBirdSkillEntry =
    AdminDirectorBirdSkillEntry(
      birdType = entry.birdType,
      name = entry.name,
      source = entry.source,
      authorId = entry.authorId,
      skillName = entry.skillName,
      tierSkillDescriptions = entry.tierSkillDescriptions,
      configured = entry.configured,
      skills = entry.skills,
      modelImageUrl = entry.modelImageUrl
    )

  def toDirectorBirdSkillBoard(board: DirectorBirdSkillBoard): AdminDirectorBirdSkillBoard =
    AdminDirectorBirdSkillBoard(birds = board.birds.map(toDirectorBirdSkillEntry))

  def toBirdSkillConfig(config: BirdSkillConfig): AdminBirdSkillConfig =
    AdminBirdSkillConfig(
      birdType = config.birdType,
      skills = config.skills,
      modelImageUrl = config.modelImageUrl,
      updatedById = config.updatedById,
      updatedAt = config.updatedAt
    )

  def toDirectorBirdPoolOption(option: BirdPoolOptionEntry): DirectorBirdPoolOption =
    DirectorBirdPoolOption(
      birdType = option.birdType,
      name = option.name,
      source = option.source,
      authorId = option.authorId
    )
}
