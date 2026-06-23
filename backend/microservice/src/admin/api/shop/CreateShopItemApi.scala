package microservice.admin.api.shop

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.shop.AdminShopItem
import microservice.admin.support.mapping.PlayerHandoffMapping
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.api.internal.admin.CreateShopItemInternalAPIMessage
import microservice.system.objects.AdminLevel
import microservice.user.utils.AccessControl
import microservice.admin.body.shop.CreateShopItemBody
import microservice.admin.validation.shop.AdminShopItemValidation

/** POST /admin/shop/items — 创建商店商品。 */
final case class CreateShopItemAPIMessage(userId: String, body: CreateShopItemBody) extends APIWithTokenMessage[AdminShopItem] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, AdminShopItem]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        input <- AdminShopItemValidation.validateCreate(body)
        item <- PlanSteps.runApi(
          CreateShopItemInternalAPIMessage(
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
