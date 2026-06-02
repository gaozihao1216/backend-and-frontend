package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class Position(x: Double, y: Double)

object Position {
  implicit val encoder: Encoder[Position] = deriveEncoder
  implicit val decoder: Decoder[Position] = deriveDecoder
}
