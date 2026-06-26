package microservice.admin.api.shop

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.shop.AdminShopItem
import microservice.admin.support.mapping.PlayerHandoffMapping
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.api.internal.admin.DeactivateShopItemInternalAPIMessage
import microservice.system.objects.enums.AdminLevel
import microservice.user.support.AccessControl

/** DELETE /admin/shop/items/:itemId — 下架商店商品（active=false）。 */
final case class DeactivateShopItemAPIMessage(userId: String, itemId: String) extends APIWithTokenMessage[AdminShopItem] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, AdminShopItem]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.fromEither(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard))
        item <- PlanSteps.runApi(DeactivateShopItemInternalAPIMessage(itemId), connection)
      } yield PlayerHandoffMapping.toShopItem(item)
    }
}
