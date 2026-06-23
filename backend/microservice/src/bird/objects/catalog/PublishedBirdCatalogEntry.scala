package microservice.bird.objects.catalog

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 已发布鸟类设计在备战目录中的投影（bird 模块导出给 player 等调用方）。 */
final case class PublishedBirdCatalogEntry(
  birdType: String,
  name: String,
  summary: String,
  previewImageUrl: String,
  attack: Int,
  impact: Int,
  speed: Int,
  skillName: String,
  tierSkills: List[String],
  authorId: String
)

private[bird] object PublishedBirdCatalogEntry {
  implicit val encoder: Encoder[PublishedBirdCatalogEntry] = deriveEncoder
  implicit val decoder: Decoder[PublishedBirdCatalogEntry] = deriveDecoder
}
