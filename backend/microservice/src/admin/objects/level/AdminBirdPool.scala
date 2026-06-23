package microservice.admin.objects.level

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** Director 槽位鸟池配置（admin 模块自有 DTO，JSON 与 level.BirdPool 对齐）。 */
final case class AdminBirdPool(
  totalBirds: Int,
  allowedBirdTypes: List[String] = Nil,
  caps: Map[String, Int] = Map.empty
)

private[admin] object AdminBirdPool {
  val default: AdminBirdPool = AdminBirdPool(totalBirds = 3)

  implicit val encoder: Encoder[AdminBirdPool] = deriveEncoder
  implicit val decoder: Decoder[AdminBirdPool] = deriveDecoder
}
