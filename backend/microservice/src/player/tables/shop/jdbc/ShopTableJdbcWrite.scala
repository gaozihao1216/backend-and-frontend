/**
  *
   * 定义：ShopTableJdbcWrite：ShopTable 表的 JDBC 写实现。
 * 问题：insert/update 需参数化 SQL 防注入且与 Row 字段一一对应。
 * 作用：INSERT/UPDATE/DELETE；写后必要时 re-read 返回最新 Row。
 * 关联：[[ShopTable]] 写路径分流；事务由 APIMessage.run 外层提交。
 */
package microservice.player.tables.shop.jdbc

import microservice.player.tables.shop._

import java.sql.Connection

private[tables] object ShopTableJdbcWrite {
  def insertPurchase(connection: Connection, row: ShopPurchaseRow): ShopPurchaseRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO shop_purchases (id, user_id, item_id, price, currency, purchased_at)
        VALUES (?, ?, ?, ?, ?, ?)
      """
    )
    try {
      statement.setString(1, row.id)
      statement.setString(2, row.userId)
      statement.setString(3, row.itemId)
      statement.setInt(4, row.price)
      statement.setString(5, row.currency)
      statement.setString(6, row.purchasedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}
