package microservice.player.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.shop.ShopItem
import microservice.player.support.shop.ShopCatalogSupport

/** 模块间 API：列出全部商店商品（含下架）；由 admin HTTP API 调用，不挂路由。 */
final case class ListShopItemsInternalAPIMessage() extends APIMessage[List[ShopItem]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[ShopItem]]] =
    PlanSteps.finish {
      PlanSteps.read(ShopCatalogSupport.listAllItems(connection))
    }
}
