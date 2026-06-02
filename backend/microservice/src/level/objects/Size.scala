package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class Size(width: Double, height: Double)

object Size {
  implicit val encoder: Encoder[Size] = deriveEncoder
  implicit val decoder: Decoder[Size] = deriveDecoder
}
