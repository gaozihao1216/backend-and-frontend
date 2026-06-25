package microservice.player.api.internal.admin

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.shop.ShopItem
import microservice.player.support.shop.ShopCatalogSupport

/** 模块间 API：更新商店商品；由 admin HTTP API 调用，不挂路由。 */
final case class UpdateShopItemInternalAPIMessage(
  itemId: String,
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
      for {
        existing <- EitherT(ShopCatalogSupport.requireItemRow(connection, itemId))
        timestamp = java.time.Instant.now().toString
        item <- EitherT(ShopCatalogSupport.requireUpdateItem(
          connection,
          existing.copy(
              name = name.trim,
              description = description.trim,
              price = price,
              currency = currency.trim,
              catalogIndex = catalogIndex,
              active = active,
              sortOrder = sortOrder,
              updatedAt = timestamp
            )
          )
        )
      } yield item
    }
}
