package microservice.level.objects.terrain

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 二维坐标点，用于障碍物、敌人、地面控制点等位置描述。 */
final case class Position(x: Double, y: Double)

object Position {
  implicit val encoder: Encoder[Position] = deriveEncoder
  implicit val decoder: Decoder[Position] = deriveDecoder
}
