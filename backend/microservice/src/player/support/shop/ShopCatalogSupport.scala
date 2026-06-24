package microservice.player.support.shop

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.objects.shop.ShopItem
import microservice.player.tables.shop.{ShopItemRow, ShopItemRowMapper, ShopTable}

/** 商店目录读写（player 模块内）；供 HTTP 与 internal API 复用。 */
private[player] object ShopCatalogSupport {
  def listAllItems(connection: Connection): List[ShopItem] =
    ShopTable.listAllItems(connection).map(ShopItemRowMapper.toShopItem).toList

  def createItem(
    connection: Connection,
    name: String,
    description: String,
    price: Int,
    currency: String,
    catalogIndex: Int,
    active: Boolean,
    sortOrder: Int
  ): ShopItem = {
    val timestamp = Instant.now().toString
    val row = ShopItemRow(
      id = ShopTable.nextItemId(connection),
      name = name.trim,
      description = description.trim,
      price = price,
      currency = currency.trim,
      catalogIndex = catalogIndex,
      active = active,
      sortOrder = sortOrder,
      createdAt = timestamp,
      updatedAt = timestamp
    )
    ShopItemRowMapper.toShopItem(ShopTable.insertItem(connection, row))
  }

  def requireItemRow(connection: Connection, itemId: String): Step[ShopItemRow] =
    EitherT.liftF(IO(ShopTable.findItemById(connection, itemId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("SHOP_ITEM_NOT_FOUND", s"Shop item not found: $itemId"))
      case Some(row) =>
        EitherT.rightT(row)
    }

  def requireUpdateItem(connection: Connection, row: ShopItemRow): Step[ShopItem] =
    EitherT.liftF(IO(ShopTable.updateItem(connection, row))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("SHOP_ITEM_NOT_FOUND", s"Shop item not found: ${row.id}"))
      case Some(updated) =>
        EitherT.rightT(ShopItemRowMapper.toShopItem(updated))
    }

  def requireDeactivateItem(connection: Connection, itemId: String): Step[ShopItem] =
    EitherT.liftF(IO(ShopTable.deactivateItem(connection, itemId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("SHOP_ITEM_NOT_FOUND", s"Shop item not found: $itemId"))
      case Some(row) =>
        EitherT.rightT(ShopItemRowMapper.toShopItem(row))
    }
}
