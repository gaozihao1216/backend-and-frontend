package microservice.bird.objects.catalog

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 系统内置鸟在 catalog 中的完整投影（bird 模块单一数据源）。 */
final case class SystemBirdCatalogEntry(
  birdType: String,
  name: String,
  summary: String,
  previewImageUrl: String,
  attack: Int,
  impact: Int,
  speed: Int,
  skillName: String,
  tierSkillDescriptions: Vector[String]
)

private[bird] object SystemBirdCatalogEntry {
  implicit val encoder: Encoder[SystemBirdCatalogEntry] = deriveEncoder
  implicit val decoder: Decoder[SystemBirdCatalogEntry] = deriveDecoder
}
