package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.{LevelStatus, LevelTag}

final case class Level(
  id: String,
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData,
  authorId: String,
  status: LevelStatus,
  rejectionReason: Option[String],
  averageRating: Double,
  ratingCount: Int,
  createdAt: String,
  updatedAt: String,
  publishedAt: Option[String]
)

object Level {
  implicit val encoder: Encoder[Level] = deriveEncoder
  implicit val decoder: Decoder[Level] = deriveDecoder
}
