package microservice.admin.api.shop

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.shop.ShopItem
import microservice.admin.support.shop.AdminShopSupport
import microservice.system.objects.AdminLevel
import microservice.user.utils.AccessControl
import microservice.admin.api.shop.body.UpdateShopItemBody
import microservice.admin.api.shop.validation.AdminShopItemValidation

/** PUT /admin/shop/items/:itemId — 更新商店商品。 */
final case class UpdateShopItemAPIMessage(userId: String, itemId: String, body: UpdateShopItemBody)
    extends APIWithTokenMessage[ShopItem] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ShopItem]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        existing <- AdminShopSupport.requireItem(connection, itemId)
        input <- AdminShopItemValidation.validateUpdate(body)
        timestamp = Instant.now().toString
        item <- AdminShopSupport.requireUpdatedItem(
          connection,
          existing.copy(
            name = input.name.trim,
            description = input.description.trim,
            price = input.price,
            currency = input.currency.trim,
            catalogIndex = input.catalogIndex,
            active = input.active,
            sortOrder = input.sortOrder,
            updatedAt = timestamp
          )
        )
      } yield item
    }
}
