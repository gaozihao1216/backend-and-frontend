package microservice.bird.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.LevelStatus

final case class BirdDesign(
  id: String,
  authorId: String,
  name: String,
  summary: String,
  skillName: String,
  attack: Int,
  impact: Int,
  speed: Int,
  tierSkills: List[String],
  previewImageUrl: String,
  mechanismTags: List[String],
  status: LevelStatus,
  rejectionReason: Option[String],
  createdAt: String,
  updatedAt: String,
  publishedAt: Option[String]
)

object BirdDesign {
  implicit val encoder: Encoder[BirdDesign] = deriveEncoder
  implicit val decoder: Decoder[BirdDesign] = deriveDecoder
}
