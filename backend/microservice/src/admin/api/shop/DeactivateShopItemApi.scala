package microservice.admin.api.shop

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.shop.ShopItem
import microservice.admin.support.shop.AdminShopSupport
import microservice.system.objects.AdminLevel
import microservice.user.utils.AccessControl

/** DELETE /admin/shop/items/:itemId — 下架商店商品（active=false）。 */
final case class DeactivateShopItemAPIMessage(userId: String, itemId: String) extends APIWithTokenMessage[ShopItem] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ShopItem]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        item <- AdminShopSupport.requireDeactivatedItem(connection, itemId)
      } yield item
    }
}
