package microservice.admin.body.shop

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /admin/shop/items/:itemId 请求体。 */
final case class UpdateShopItemBody(
  name: String,
  description: String,
  price: Int,
  currency: String,
  catalogIndex: Int,
  active: Boolean,
  sortOrder: Int
)

private[admin] object UpdateShopItemBody {
  implicit val encoder: Encoder[UpdateShopItemBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateShopItemBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateShopItemBody] = jsonOf
}
