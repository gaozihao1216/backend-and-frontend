package microservice.level.objects.core

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** Matter.js 物理世界配置。
  *
  * 字段说明：
  *   - width / height：世界画布尺寸（像素）
  *   - gravity：重力加速度
  */
final case class GameWorld(width: Double, height: Double, gravity: Double)

/** GameWorld 伴生对象：Circe JSON 编解码，嵌入 LevelData.world。 */
private[level] object GameWorld {
  implicit val encoder: Encoder[GameWorld] = deriveEncoder
  implicit val decoder: Decoder[GameWorld] = deriveDecoder
}
