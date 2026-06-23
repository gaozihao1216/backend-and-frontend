package microservice.level.objects.terrain

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 贝塞尔曲线型地面：由控制点列表定义曲线形状。 */
final case class GroundBezier(controlPoints: List[Position]) extends LevelGround {
  override val `type`: String = "bezier"
}

/** GroundBezier 伴生对象：Circe JSON 编解码，贝塞尔地面曲线段。 */
private[level] object GroundBezier {
  implicit val encoder: Encoder[GroundBezier] = deriveEncoder
  implicit val decoder: Decoder[GroundBezier] = deriveDecoder
}
