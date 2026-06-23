package microservice.player.support.catalog

import microservice.bird.objects.catalog.{PublishedBirdCatalogEntry, SystemBirdCatalogEntry}
import microservice.bird.objects.skill.config.BirdSkillConfig
import microservice.player.objects.catalog.{PreparationPublishedBirdSnapshot, PreparationSystemBirdSnapshot}
import microservice.player.objects.preparation.BirdSkillConfigView

/** bird internal API 响应 → player 边界 DTO（仅在 support 层引用 bird 类型）。 */
object PreparationCatalogMapping {
  def toSystemSnapshot(entry: SystemBirdCatalogEntry): PreparationSystemBirdSnapshot =
    PreparationSystemBirdSnapshot(
      birdType = entry.birdType,
      name = entry.name,
      summary = entry.summary,
      previewImageUrl = entry.previewImageUrl,
      attack = entry.attack,
      impact = entry.impact,
      speed = entry.speed,
      skillName = entry.skillName,
      tierSkillDescriptions = entry.tierSkillDescriptions
    )

  def toPublishedSnapshot(entry: PublishedBirdCatalogEntry): PreparationPublishedBirdSnapshot =
    PreparationPublishedBirdSnapshot(
      birdType = entry.birdType,
      name = entry.name,
      summary = entry.summary,
      previewImageUrl = entry.previewImageUrl,
      attack = entry.attack,
      impact = entry.impact,
      speed = entry.speed,
      skillName = entry.skillName,
      tierSkills = entry.tierSkills,
      authorId = entry.authorId
    )

  def toSkillConfigView(config: BirdSkillConfig): BirdSkillConfigView =
    BirdSkillConfigView(
      birdType = config.birdType,
      skills = config.skills,
      modelImageUrl = config.modelImageUrl
    )
}
