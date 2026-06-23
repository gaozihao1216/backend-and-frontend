package microservice.admin.api.shop

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.shop.ShopItem
import microservice.player.tables.shop.{ShopItemRow, ShopItemRowMapper, ShopTable}
import microservice.system.objects.AdminLevel
import microservice.user.utils.AccessControl
import microservice.admin.api.shop.body.CreateShopItemBody
import microservice.admin.api.shop.validation.AdminShopItemValidation

/** POST /admin/shop/items — 创建商店商品。 */
final case class CreateShopItemAPIMessage(userId: String, body: CreateShopItemBody) extends APIWithTokenMessage[ShopItem] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ShopItem]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        input <- AdminShopItemValidation.validateCreate(body)
        timestamp = Instant.now().toString
        item <- PlanSteps.read {
          val row = ShopItemRow(
            id = ShopTable.nextItemId(connection),
            name = input.name.trim,
            description = input.description.trim,
            price = input.price,
            currency = input.currency.trim,
            catalogIndex = input.catalogIndex,
            active = input.active,
            sortOrder = input.sortOrder,
            createdAt = timestamp,
            updatedAt = timestamp
          )
          ShopItemRowMapper.toShopItem(ShopTable.insertItem(connection, row))
        }
      } yield item
    }
}
