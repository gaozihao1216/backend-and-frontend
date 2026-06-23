package microservice.admin.support.shop

import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.objects.shop.ShopItem
import microservice.player.tables.shop.{ShopItemRow, ShopItemRowMapper, ShopTable}

/** 管理员商店 CRUD 的查表与写结果校验。 */
object AdminShopSupport {
  def requireItem(connection: Connection, itemId: String): Step[ShopItemRow] =
    PlanStep.fromEither(checkItem(connection, itemId))

  def requireUpdatedItem(connection: Connection, row: ShopItemRow): Step[ShopItem] =
    PlanStep.fromEither(checkUpdatedItem(connection, row))

  def requireDeactivatedItem(connection: Connection, itemId: String): Step[ShopItem] =
    PlanStep.fromEither(checkDeactivatedItem(connection, itemId))

  def checkItem(connection: Connection, itemId: String): Either[HttpError, ShopItemRow] =
    ShopTable.findItemById(connection, itemId).toRight(
      HttpError.notFound("SHOP_ITEM_NOT_FOUND", s"Shop item not found: $itemId")
    )

  def checkUpdatedItem(connection: Connection, row: ShopItemRow): Either[HttpError, ShopItem] =
    ShopTable
      .updateItem(connection, row)
      .map(ShopItemRowMapper.toShopItem)
      .toRight(HttpError.notFound("SHOP_ITEM_NOT_FOUND", s"Shop item not found: ${row.id}"))

  def checkDeactivatedItem(connection: Connection, itemId: String): Either[HttpError, ShopItem] =
    ShopTable
      .deactivateItem(connection, itemId)
      .map(ShopItemRowMapper.toShopItem)
      .toRight(HttpError.notFound("SHOP_ITEM_NOT_FOUND", s"Shop item not found: $itemId"))
}
