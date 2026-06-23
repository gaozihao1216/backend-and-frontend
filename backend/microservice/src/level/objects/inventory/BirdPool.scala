package microservice.level.objects.inventory

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** Director 配置的鸟池限制：总数量、允许类型与各类上限。
  *
  * 字段说明：
  *   - totalBirds：本关可用鸟总数
  *   - allowedBirdTypes：允许的鸟类型 ID 列表
  *   - caps：各鸟类型的数量上限映射
  */
final case class BirdPool(
  totalBirds: Int,
  allowedBirdTypes: List[String] = Nil,
  caps: Map[String, Int] = Map.empty
)

/** BirdPool 伴生对象：默认鸟池常量与 Circe JSON 编解码。 */
private[level] object BirdPool {
  /** 槽位未配置 bird pool 时的默认值（总数 3）。 */
  val default: BirdPool = BirdPool(totalBirds = 3)

  implicit val encoder: Encoder[BirdPool] = deriveEncoder
  implicit val decoder: Decoder[BirdPool] = deriveDecoder
}
