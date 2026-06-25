package microservice.admin.objects.shop.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /admin/shop/items/:itemId 请求对象。 */
final case class UpdateShopItemRequest(
  name: String,
  description: String,
  price: Int,
  currency: String,
  catalogIndex: Int,
  active: Boolean,
  sortOrder: Int
)

private[admin] object UpdateShopItemRequest {
  implicit val encoder: Encoder[UpdateShopItemRequest] = deriveEncoder
  implicit val decoder: Decoder[UpdateShopItemRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateShopItemRequest] = jsonOf
}
