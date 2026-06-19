/**
  *
   * 定义：ShopTableCodec：JDBC ResultSet ↔ Row 列映射与 baseSelect SQL 片段。
 * 问题：snake_case SQL 列名与 Scala camelCase 字段需集中转换。
 * 作用：baseSelect 复用；rowFromResultSet 解析枚举与 Option 列。
 * 关联：[[ShopTableTableJdbcRead]] / [[ShopTableTableJdbcWrite]] 共用。
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
