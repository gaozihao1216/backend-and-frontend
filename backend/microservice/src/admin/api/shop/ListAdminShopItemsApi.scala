package microservice.admin.api.shop

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.shop.AdminShopItem
import microservice.admin.support.mapping.PlayerHandoffMapping
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.api.internal.admin.ListShopItemsInternalAPIMessage
import microservice.system.objects.AdminLevel
import microservice.user.support.AccessControl

/** GET /admin/shop/items — 列出全部商店商品（含下架）。 */
final case class ListAdminShopItemsAPIMessage(userId: String) extends APIWithTokenMessage[List[AdminShopItem]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[AdminShopItem]]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        items <- PlanSteps.runApi(ListShopItemsInternalAPIMessage(), connection)
      } yield items.map(PlayerHandoffMapping.toShopItem)
    }
}
