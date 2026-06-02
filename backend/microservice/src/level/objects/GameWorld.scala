package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class GameWorld(width: Double, height: Double, gravity: Double)

object GameWorld {
  implicit val encoder: Encoder[GameWorld] = deriveEncoder
  implicit val decoder: Decoder[GameWorld] = deriveDecoder
}
