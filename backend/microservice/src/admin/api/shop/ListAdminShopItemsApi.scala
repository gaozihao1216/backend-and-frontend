package microservice.admin.api.shop

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.shop.ShopItem
import microservice.player.tables.shop.{ShopItemRowMapper, ShopTable}
import microservice.system.objects.AdminLevel
import microservice.user.utils.AccessControl

/** GET /admin/shop/items — 列出全部商店商品（含下架）。 */
final case class ListAdminShopItemsAPIMessage(userId: String) extends APIWithTokenMessage[List[ShopItem]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[ShopItem]]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        items <- PlanSteps.read(ShopTable.listAllItems(connection).map(ShopItemRowMapper.toShopItem).toList)
      } yield items
    }
}
