package microservice.player.objects.shop

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 商店商品领域对象（玩家浏览与管理员维护共用）。 */
final case class ShopItem(
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

object ShopItem {
  implicit val encoder: Encoder[ShopItem] = deriveEncoder
  implicit val decoder: Decoder[ShopItem] = deriveDecoder
}
