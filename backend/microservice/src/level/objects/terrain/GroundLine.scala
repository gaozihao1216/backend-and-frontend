package microservice.level.objects.terrain

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 折线型地面：由一系列 Position 控制点连接而成。 */
final case class GroundLine(points: List[Position]) extends LevelGround {
  override val `type`: String = "line"
}

/** GroundLine 伴生对象：Circe JSON 编解码，直线地面段。 */
private[level] object GroundLine {
  implicit val encoder: Encoder[GroundLine] = deriveEncoder
  implicit val decoder: Decoder[GroundLine] = deriveDecoder
}
