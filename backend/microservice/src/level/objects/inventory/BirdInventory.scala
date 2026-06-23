package microservice.level.objects.inventory

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 关卡内玩家可用鸟的数量配置（基础鸟池）。 */
final case class BirdInventory(basic: Int)

/** BirdInventory 伴生对象：Circe JSON 编解码，嵌入 LevelData.birdInventory。 */
private[level] object BirdInventory {
  implicit val encoder: Encoder[BirdInventory] = deriveEncoder
  implicit val decoder: Decoder[BirdInventory] = deriveDecoder
}
