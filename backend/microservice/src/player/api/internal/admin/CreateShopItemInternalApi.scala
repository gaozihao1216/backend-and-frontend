package microservice.player.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.shop.ShopItem
import microservice.player.support.shop.ShopCatalogSupport

/** 模块间 API：创建商店商品；由 admin HTTP API 调用，不挂路由。 */
final case class CreateShopItemInternalAPIMessage(
  name: String,
  description: String,
  price: Int,
  currency: String,
  catalogIndex: Int,
  active: Boolean,
  sortOrder: Int
) extends APIMessage[ShopItem] {
  override def plan(connection: Connection): IO[Either[HttpError, ShopItem]] =
    PlanSteps.finish {
      PlanSteps.read(
        ShopCatalogSupport.createItem(
          connection,
          name,
          description,
          price,
          currency,
          catalogIndex,
          active,
          sortOrder
        )
      )
    }
}
