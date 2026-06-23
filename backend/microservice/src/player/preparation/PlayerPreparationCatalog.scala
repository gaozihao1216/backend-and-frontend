package microservice.player.preparation

import microservice.player.objects.catalog.{PreparationPublishedBirdSnapshot, PreparationSystemBirdSnapshot}

/** 备战鸟目录合并（player 模块内，不依赖 bird.objects）。 */
object PlayerPreparationCatalog {
  def merge(
    system: List[PreparationSystemBirdSnapshot],
    published: List[PreparationPublishedBirdSnapshot]
  ): Vector[BirdCatalogEntry] =
    system.map(fromSystemSnapshot).toVector ++ published.map(fromPublishedSnapshot).toVector

  def fromSystemSnapshot(entry: PreparationSystemBirdSnapshot): BirdCatalogEntry =
    BirdCatalogEntry(
      birdType = entry.birdType,
      name = entry.name,
      summary = entry.summary,
      previewImageUrl = entry.previewImageUrl,
      baseStats = BirdBaseStats(entry.attack, entry.impact, entry.speed),
      skillName = entry.skillName,
      tierSkillDescriptions = entry.tierSkillDescriptions,
      source = "system",
      authorId = None
    )

  def fromPublishedSnapshot(design: PreparationPublishedBirdSnapshot): BirdCatalogEntry = {
    val tierSkills =
      if (design.tierSkills.length >= BirdPreparationCatalog.maxTier) design.tierSkills.take(BirdPreparationCatalog.maxTier)
      else design.tierSkills ++ List.fill(BirdPreparationCatalog.maxTier - design.tierSkills.length)("待补充技能描述")

    BirdCatalogEntry(
      birdType = design.birdType,
      name = design.name,
      summary = design.summary,
      previewImageUrl = design.previewImageUrl,
      baseStats = BirdBaseStats(design.attack, design.impact, design.speed),
      skillName = design.skillName,
      tierSkillDescriptions = tierSkills.toVector,
      source = "designer",
      authorId = Some(design.authorId)
    )
  }

  def find(catalog: Vector[BirdCatalogEntry], birdType: String): Option[BirdCatalogEntry] =
    catalog.find(_.birdType == birdType)
}
