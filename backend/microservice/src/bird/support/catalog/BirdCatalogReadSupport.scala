package microservice.bird.support.catalog

import java.sql.Connection
import microservice.bird.objects.catalog.{BirdPoolOptionEntry, PublishedBirdCatalogEntry, SystemBirdCatalogEntry}

/** 合并系统鸟与已发布设计鸟的 catalog 读操作（bird 模块内）。 */
private[bird] object BirdCatalogReadSupport {
  def listSystemEntries: List[SystemBirdCatalogEntry] =
    SystemBirdCatalogSupport.entries.toList

  def listBirdPoolOptions(connection: Connection): List[BirdPoolOptionEntry] = {
    val systemOptions =
      SystemBirdCatalogSupport.entries.map { entry =>
        BirdPoolOptionEntry(
          birdType = entry.birdType,
          name = entry.name,
          source = "system",
          authorId = None
        )
      }.toList

    val designerOptions =
      PublishedBirdCatalogSupport.listPublished(connection).map { design =>
        BirdPoolOptionEntry(
          birdType = design.birdType,
          name = design.name,
          source = "designer",
          authorId = Some(design.authorId)
        )
      }

    systemOptions ++ designerOptions
  }

  def listDirectorCatalogEntries(connection: Connection): List[DirectorCatalogEntry] = {
    val systemEntries =
      SystemBirdCatalogSupport.entries.map { entry =>
        DirectorCatalogEntry(
          birdType = entry.birdType,
          name = entry.name,
          source = "system",
          authorId = None,
          skillName = entry.skillName,
          tierSkillDescriptions = entry.tierSkillDescriptions.toList,
          previewImageUrl = entry.previewImageUrl
        )
      }.toList

    val designerEntries =
      PublishedBirdCatalogSupport.listPublished(connection).map { design =>
        val tierSkills =
          if (design.tierSkills.length >= SystemBirdCatalogSupport.maxTier) design.tierSkills.take(SystemBirdCatalogSupport.maxTier)
          else design.tierSkills ++ List.fill(SystemBirdCatalogSupport.maxTier - design.tierSkills.length)("待补充技能描述")

        DirectorCatalogEntry(
          birdType = design.birdType,
          name = design.name,
          source = "designer",
          authorId = Some(design.authorId),
          skillName = design.skillName,
          tierSkillDescriptions = tierSkills,
          previewImageUrl = design.previewImageUrl
        )
      }

    systemEntries ++ designerEntries
  }
}

/** 总监技能看板用的鸟 catalog 条目（bird 模块内）。 */
final case class DirectorCatalogEntry(
  birdType: String,
  name: String,
  source: String,
  authorId: Option[String],
  skillName: String,
  tierSkillDescriptions: List[String],
  previewImageUrl: String
)
