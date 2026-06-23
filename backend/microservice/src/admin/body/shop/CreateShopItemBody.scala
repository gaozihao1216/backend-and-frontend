package microservice.admin.body.shop

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /admin/shop/items 请求体；字段语义见 [[microservice.player.objects.shop.ShopItem]]。 */
final case class CreateShopItemBody(
  name: String,
  description: String,
  price: Int,
  currency: String,
  catalogIndex: Int = 0,
  active: Boolean = true,
  sortOrder: Int = 0
)

object CreateShopItemBody {
  implicit val encoder: Encoder[CreateShopItemBody] = deriveEncoder
  implicit val decoder: Decoder[CreateShopItemBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateShopItemBody] = jsonOf
}
