package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class LevelEnemy(
  id: String,
  `type`: String,
  position: Position,
  size: Option[Size]
)

object LevelEnemy {
  implicit val encoder: Encoder[LevelEnemy] = deriveEncoder
  implicit val decoder: Decoder[LevelEnemy] = deriveDecoder
}
