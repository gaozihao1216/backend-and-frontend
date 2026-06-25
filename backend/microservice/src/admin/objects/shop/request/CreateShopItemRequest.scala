package microservice.admin.objects.shop.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /admin/shop/items 请求对象；字段语义见 [[microservice.player.objects.shop.ShopItem]]。 */
final case class CreateShopItemRequest(
  name: String,
  description: String,
  price: Int,
  currency: String,
  catalogIndex: Int = 0,
  active: Boolean = true,
  sortOrder: Int = 0
)

private[admin] object CreateShopItemRequest {
  implicit val encoder: Encoder[CreateShopItemRequest] = deriveEncoder
  implicit val decoder: Decoder[CreateShopItemRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateShopItemRequest] = jsonOf
}
