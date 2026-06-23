package microservice.level.objects.terrain

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 矩形尺寸，用于障碍物与敌人的宽高描述。 */
final case class Size(width: Double, height: Double)

/** Size 伴生对象：Circe JSON 编解码，宽高尺寸值对象。 */
private[level] object Size {
  implicit val encoder: Encoder[Size] = deriveEncoder
  implicit val decoder: Decoder[Size] = deriveDecoder
}
