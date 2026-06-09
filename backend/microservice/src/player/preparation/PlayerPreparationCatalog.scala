package microservice.player.preparation

import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdRowMapper}
import java.sql.Connection

object PlayerPreparationCatalog {
  def loadEntries(connection: Connection): Vector[BirdCatalogEntry] =
    BirdPreparationCatalog.entries.map(_.copy(source = "system")) ++
      BirdDesignTable
        .listPublished(connection)
        .map(BirdRowMapper.toBirdDesign)
        .map(fromPublishedDesign)

  def find(connection: Connection, birdType: String): Option[BirdCatalogEntry] =
    loadEntries(connection).find(_.birdType == birdType)

  private def fromPublishedDesign(design: microservice.bird.objects.BirdDesign): BirdCatalogEntry = {
    val tierSkills =
      if (design.tierSkills.length >= BirdPreparationCatalog.maxTier) design.tierSkills.take(BirdPreparationCatalog.maxTier)
      else design.tierSkills ++ List.fill(BirdPreparationCatalog.maxTier - design.tierSkills.length)("待补充技能描述")

    BirdCatalogEntry(
      birdType = design.id,
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
}
