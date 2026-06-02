package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class LevelComment(
  id: String,
  levelId: String,
  userId: String,
  content: String,
  createdAt: String
)

object LevelComment {
  implicit val encoder: Encoder[LevelComment] = deriveEncoder
  implicit val decoder: Decoder[LevelComment] = deriveDecoder
}
