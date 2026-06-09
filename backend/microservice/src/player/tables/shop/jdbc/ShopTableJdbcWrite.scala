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
