package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class Rating(
  id: String,
  levelId: String,
  playerId: String,
  score: Int,
  createdAt: String,
  updatedAt: String
)

object Rating {
  implicit val encoder: Encoder[Rating] = deriveEncoder
  implicit val decoder: Decoder[Rating] = deriveDecoder
}
