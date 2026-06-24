package microservice.bird.support.catalog

import java.sql.Connection
import microservice.bird.objects.catalog.PublishedBirdCatalogEntry
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.submission.BirdSubmissionTable

/** 已发布鸟类设计目录（bird 模块内）。 */
private[bird] object PublishedBirdCatalogSupport {
  def listPublished(connection: Connection): List[PublishedBirdCatalogEntry] =
    BirdDesignTable
      .listPublished(connection)
      .map(BirdDesignTable.toBirdDesign)
      .map { design =>
        PublishedBirdCatalogEntry(
          birdType = design.id,
          name = design.name,
          summary = design.summary,
          previewImageUrl = design.previewImageUrl,
          attack = design.attack,
          impact = design.impact,
          speed = design.speed,
          skillName = design.skillName,
          tierSkills = design.tierSkills,
          authorId = design.authorId
        )
      }
      .toList
}
