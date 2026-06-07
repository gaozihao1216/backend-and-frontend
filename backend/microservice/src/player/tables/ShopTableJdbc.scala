package microservice.player.tables

import java.sql.Connection

private[tables] object ShopTableJdbc {
  def initialize(connection: Connection): Unit =
    ShopTableJdbcSchema.initialize(connection)

  def listActiveItems(connection: Connection): Vector[ShopItemRow] =
    ShopTableJdbcRead.listActiveItems(connection)

  def findItemById(connection: Connection, itemId: String): Option[ShopItemRow] =
    ShopTableJdbcRead.findItemById(connection, itemId)

  def listPurchasesByUser(connection: Connection, userId: String): Vector[ShopPurchaseRow] =
    ShopTableJdbcRead.listPurchasesByUser(connection, userId)

  def nextPurchaseId(connection: Connection): String =
    ShopTableJdbcRead.nextPurchaseId(connection)

  def insertPurchase(connection: Connection, row: ShopPurchaseRow): ShopPurchaseRow =
    ShopTableJdbcWrite.insertPurchase(connection, row)
}
