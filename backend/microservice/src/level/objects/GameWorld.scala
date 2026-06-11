package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** Matter.js 物理世界配置。
  *
  * 字段说明：
  *   - width / height：世界画布尺寸（像素）
  *   - gravity：重力加速度
  */
final case class GameWorld(width: Double, height: Double, gravity: Double)

object GameWorld {
  implicit val encoder: Encoder[GameWorld] = deriveEncoder
  implicit val decoder: Decoder[GameWorld] = deriveDecoder
}
