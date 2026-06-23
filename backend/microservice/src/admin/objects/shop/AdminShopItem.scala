package microservice.admin.objects.shop

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 管理员商店商品 DTO（admin 模块自有，JSON 与 player.ShopItem 对齐）。 */
final case class AdminShopItem(
  id: String,
  name: String,
  description: String,
  price: Int,
  currency: String,
  catalogIndex: Int,
  active: Boolean,
  sortOrder: Int,
  createdAt: String,
  updatedAt: String
)

private[admin] object AdminShopItem {
  implicit val encoder: Encoder[AdminShopItem] = deriveEncoder
  implicit val decoder: Decoder[AdminShopItem] = deriveDecoder
}
