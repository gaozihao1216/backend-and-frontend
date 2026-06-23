package microservice.level.objects.terrain

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 二维坐标点，用于障碍物、敌人、地面控制点等位置描述。 */
final case class Position(x: Double, y: Double)

/** Position 伴生对象：Circe JSON 编解码，二维坐标值对象。 */
private[level] object Position {
  implicit val encoder: Encoder[Position] = deriveEncoder
  implicit val decoder: Decoder[Position] = deriveDecoder
}
