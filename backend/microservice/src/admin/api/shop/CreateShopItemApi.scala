package microservice.admin.api.shop

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.shop.AdminShopItem
import microservice.admin.support.mapping.PlayerHandoffMapping
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.api.internal.admin.CreateShopItemInternalAPIMessage
import microservice.system.objects.enums.AdminLevel
import microservice.user.support.AccessControl
import microservice.admin.objects.shop.request.CreateShopItemRequest
import microservice.admin.validation.shop.AdminShopItemValidation

/** POST /admin/shop/items — 创建商店商品。 */
final case class CreateShopItemAPIMessage(userId: String, body: CreateShopItemRequest) extends APIWithTokenMessage[AdminShopItem] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, AdminShopItem]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.fromEither(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard))
        input <- EitherT(AdminShopItemValidation.validateCreate(body))
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
