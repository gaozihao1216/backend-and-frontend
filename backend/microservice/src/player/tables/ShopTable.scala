package microservice.player.tables

import java.sql.Connection
import java.time.Instant

object ShopTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) ShopTableJdbcSchema.initialize(connection)
    else ShopTableInMemory.seedDefaults()

  def listActiveItems(connection: Connection): Vector[ShopItemRow] =
    if (isInMemory(connection)) ShopTableInMemory.listActiveItems()
    else ShopTableJdbcRead.listActiveItems(connection)

  def findItemById(connection: Connection, itemId: String): Option[ShopItemRow] =
    if (isInMemory(connection)) ShopTableInMemory.findItemById(itemId)
    else ShopTableJdbcRead.findItemById(connection, itemId)

  def listPurchasesByUser(connection: Connection, userId: String): Vector[ShopPurchaseRow] =
    if (isInMemory(connection)) ShopTableInMemory.listPurchasesByUser(userId)
    else ShopTableJdbcRead.listPurchasesByUser(connection, userId)

  def recordPurchase(connection: Connection, userId: String, item: ShopItemRow): ShopPurchaseRow = {
    val row = ShopPurchaseRow(
      id =
        if (isInMemory(connection)) ShopTableInMemory.nextPurchaseId()
        else ShopTableJdbcRead.nextPurchaseId(connection),
      userId = userId,
      itemId = item.id,
      price = item.price,
      currency = item.currency,
      purchasedAt = Instant.now().toString
    )
    if (isInMemory(connection)) ShopTableInMemory.insertPurchase(row)
    else ShopTableJdbcWrite.insertPurchase(connection, row)
  }
}
