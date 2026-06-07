package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class BirdPool(
  totalBirds: Int,
  allowedBirdTypes: List[String] = Nil,
  caps: Map[String, Int] = Map.empty
)

object BirdPool {
  val default: BirdPool = BirdPool(totalBirds = 3)

  implicit val encoder: Encoder[BirdPool] = deriveEncoder
  implicit val decoder: Decoder[BirdPool] = deriveDecoder
}
