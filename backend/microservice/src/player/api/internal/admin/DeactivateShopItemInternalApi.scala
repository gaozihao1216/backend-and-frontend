package microservice.player.api.internal.admin

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.shop.ShopItem
import microservice.player.support.shop.ShopCatalogSupport

/** 模块间 API：下架商店商品；由 admin HTTP API 调用，不挂路由。 */
final case class DeactivateShopItemInternalAPIMessage(itemId: String) extends APIMessage[ShopItem] {
  override def plan(connection: Connection): IO[Either[HttpError, ShopItem]] =
    PlanSteps.finish {
      EitherT(ShopCatalogSupport.requireDeactivateItem(connection, itemId))
    }
}
