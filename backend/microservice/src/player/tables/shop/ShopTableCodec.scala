/** JDBC 读路径专用：SQL 列名 ↔ 商店 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL snake_case 列对齐。
  */
package microservice.player.tables.shop

import java.sql.ResultSet

object ShopItemTableCodec {
  val baseSelect: String =
    "SELECT id, name, description, price, currency, catalog_index, active, sort_order, created_at, updated_at FROM shop_items"

  def rowFromResultSet(resultSet: ResultSet): ShopItemRow =
    ShopItemRow(
      id = resultSet.getString("id"),
      name = resultSet.getString("name"),
      description = resultSet.getString("description"),
      price = resultSet.getInt("price"),
      currency = resultSet.getString("currency"),
      catalogIndex = resultSet.getInt("catalog_index"),
      active = resultSet.getBoolean("active"),
      sortOrder = resultSet.getInt("sort_order"),
      createdAt = resultSet.getString("created_at"),
      updatedAt = resultSet.getString("updated_at")
    )
}

object ShopPurchaseTableCodec {
  val baseSelect: String =
    "SELECT id, user_id, item_id, price, currency, purchased_at FROM shop_purchases"

  def rowFromResultSet(resultSet: ResultSet): ShopPurchaseRow =
    ShopPurchaseRow(
      id = resultSet.getString("id"),
      userId = resultSet.getString("user_id"),
      itemId = resultSet.getString("item_id"),
      price = resultSet.getInt("price"),
      currency = resultSet.getString("currency"),
      purchasedAt = resultSet.getString("purchased_at")
    )
}
