package microservice.level.objects.terrain

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 折线型地面：由一系列 Position 控制点连接而成。 */
final case class GroundLine(points: List[Position]) extends LevelGround {
  override val `type`: String = "line"
}

object GroundLine {
  implicit val encoder: Encoder[GroundLine] = deriveEncoder
  implicit val decoder: Decoder[GroundLine] = deriveDecoder
}
