package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class Favorite(
  id: String,
  levelId: String,
  userId: String,
  createdAt: String
)

object Favorite {
  implicit val encoder: Encoder[Favorite] = deriveEncoder
  implicit val decoder: Decoder[Favorite] = deriveDecoder
}
