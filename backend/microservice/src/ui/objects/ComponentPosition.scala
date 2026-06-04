package microservice.ui.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class ComponentPosition(
  x: Double,
  y: Double,
  width: Double,
  height: Double
)

object ComponentPosition {
  implicit val encoder: Encoder[ComponentPosition] = deriveEncoder
  implicit val decoder: Decoder[ComponentPosition] = deriveDecoder
}
