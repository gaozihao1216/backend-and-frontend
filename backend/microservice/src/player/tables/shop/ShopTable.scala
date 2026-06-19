package microservice.player.tables.shop

import microservice.player.tables.shop.inmemory._
import microservice.player.tables.shop.jdbc._

import java.sql.Connection
import java.time.Instant

/**
  *
   * 定义：ShopTable 表访问门面，connection==null 走 in-memory，否则 JDBC。
 * 问题：player 持久化需双后端一致 API，避免 APIMessage 分支存储逻辑。
 * 作用：initialize/list/find/insert/update 等统一入口。
 * 关联：[[DatabaseSession]]；inmemory 与 jdbc 子包实现。
 */
object ShopTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** 启动时建表/种子数据。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) ShopTableJdbcSchema.initialize(connection)
    else ShopTableInMemory.seedDefaults()

  /** 返回全部上架商品。 */
  def listActiveItems(connection: Connection): Vector[ShopItemRow] =
    if (isInMemory(connection)) ShopTableInMemory.listActiveItems()
    else ShopTableJdbcRead.listActiveItems(connection)

  /** 按 itemId 查找商品（购买前校验）。 */
  def findItemById(connection: Connection, itemId: String): Option[ShopItemRow] =
    if (isInMemory(connection)) ShopTableInMemory.findItemById(itemId)
    else ShopTableJdbcRead.findItemById(connection, itemId)

  /** 返回用户全部购买记录（前端用于标记已购商品）。 */
  def listPurchasesByUser(connection: Connection, userId: String): Vector[ShopPurchaseRow] =
    if (isInMemory(connection)) ShopTableInMemory.listPurchasesByUser(userId)
    else ShopTableJdbcRead.listPurchasesByUser(connection, userId)

  /** 记录一次购买并返回购买行（含自动生成的 purchase id）。 */
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
