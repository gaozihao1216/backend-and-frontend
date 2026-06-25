package microservice.admin.api.shop

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.shop.AdminShopItem
import microservice.admin.support.mapping.PlayerHandoffMapping
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.api.internal.admin.UpdateShopItemInternalAPIMessage
import microservice.system.objects.enums.AdminLevel
import microservice.user.support.AccessControl
import microservice.admin.objects.shop.request.UpdateShopItemRequest
import microservice.admin.validation.shop.AdminShopItemValidation

/** PUT /admin/shop/items/:itemId — 更新商店商品。 */
final case class UpdateShopItemAPIMessage(userId: String, itemId: String, body: UpdateShopItemRequest)
    extends APIWithTokenMessage[AdminShopItem] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, AdminShopItem]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        input <- EitherT(AdminShopItemValidation.validateUpdate(body))
        item <- PlanSteps.runApi(
          UpdateShopItemInternalAPIMessage(
            itemId = itemId,
            name = input.name,
            description = input.description,
            price = input.price,
            currency = input.currency,
            catalogIndex = input.catalogIndex,
            active = input.active,
            sortOrder = input.sortOrder
          ),
          connection
        )
      } yield PlayerHandoffMapping.toShopItem(item)
    }
}
