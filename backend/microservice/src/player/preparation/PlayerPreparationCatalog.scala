package microservice.player.preparation

import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdRowMapper}
import java.sql.Connection

/** 备战鸟目录聚合：系统内置鸟 + 设计师已发布鸟设计。
  *
  * 实现：合并 BirdPreparationCatalog 与 BirdDesignTable.listPublished。
  * 关联：PlayerPreparationSupport / APIMessage plan 构建响应时调用。
  */
object PlayerPreparationCatalog {
  /** 加载完整鸟目录（系统 + 设计师发布）。 */
  def loadEntries(connection: Connection): Vector[BirdCatalogEntry] =
    BirdPreparationCatalog.entries.map(_.copy(source = "system")) ++
      BirdDesignTable
        .listPublished(connection)
        .map(BirdRowMapper.toBirdDesign)
        .map(fromPublishedDesign)

  /** 在完整目录中按 birdType 查找（升级/升阶前校验）。 */
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
