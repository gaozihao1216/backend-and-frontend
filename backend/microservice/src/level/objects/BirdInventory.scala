package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class BirdInventory(basic: Int)

object BirdInventory {
  implicit val encoder: Encoder[BirdInventory] = deriveEncoder
  implicit val decoder: Decoder[BirdInventory] = deriveDecoder
}
