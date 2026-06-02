package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class GroundBezier(controlPoints: List[Position]) extends LevelGround {
  override val `type`: String = "bezier"
}

object GroundBezier {
  implicit val encoder: Encoder[GroundBezier] = deriveEncoder
  implicit val decoder: Decoder[GroundBezier] = deriveDecoder
}
