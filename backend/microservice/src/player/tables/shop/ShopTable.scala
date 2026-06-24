package microservice.player.tables.shop

import microservice.player.objects.shop.ShopItem
import java.sql.ResultSet
import java.sql.Connection
import java.time.Instant
import microservice.player.tables.shop._

private[player] object ShopItemRowMapper {
  def toShopItem(row: ShopItemRow): ShopItem =
    ShopItem(
      id = row.id,
      name = row.name,
      description = row.description,
      price = row.price,
      currency = row.currency,
      catalogIndex = row.catalogIndex,
      active = row.active,
      sortOrder = row.sortOrder,
      createdAt = row.createdAt,
      updatedAt = row.updatedAt
    )

  def fromShopItem(item: ShopItem): ShopItemRow =
    ShopItemRow(
      id = item.id,
      name = item.name,
      description = item.description,
      price = item.price,
      currency = item.currency,
      catalogIndex = item.catalogIndex,
      active = item.active,
      sortOrder = item.sortOrder,
      createdAt = item.createdAt,
      updatedAt = item.updatedAt
    )
}

final case class ShopItemRow(
  id: String,
  name: String,
  description: String,
  price: Int,
  currency: String,
  catalogIndex: Int,
  active: Boolean,
  sortOrder: Int,
  createdAt: String,
  updatedAt: String
)

final case class ShopPurchaseRow(
  id: String,
  userId: String,
  itemId: String,
  price: Int,
  currency: String,
  purchasedAt: String
)

private[player] object ShopItemTableCodec {
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

  def bindRow(statement: java.sql.PreparedStatement, row: ShopItemRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.name)
    statement.setString(3, row.description)
    statement.setInt(4, row.price)
    statement.setString(5, row.currency)
    statement.setInt(6, row.catalogIndex)
    statement.setBoolean(7, row.active)
    statement.setInt(8, row.sortOrder)
    statement.setString(9, row.createdAt)
    statement.setString(10, row.updatedAt)
  }
}

private[player] object ShopPurchaseTableCodec {
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

/** 玩家商店表访问入口：只使用 JDBC 连接，事务由 APIMessage/DatabaseSession 统一管理。 */
private[player] object ShopTable {

  def listActiveItems(connection: Connection): Vector[ShopItemRow] =
    ShopTableSql.listActiveItems(connection)

  def listAllItems(connection: Connection): Vector[ShopItemRow] =
    ShopTableSql.listAllItems(connection)

  def nextItemId(connection: Connection): String =
    ShopTableSql.nextItemId(connection)

  def insertItem(connection: Connection, row: ShopItemRow): ShopItemRow =
    ShopTableSql.insertItem(connection, row)

  def updateItem(connection: Connection, row: ShopItemRow): Option[ShopItemRow] =
    ShopTableSql.updateItem(connection, row)

  def deactivateItem(connection: Connection, itemId: String): Option[ShopItemRow] =
    ShopTableSql.deactivateItem(connection, itemId)

  def findItemById(connection: Connection, itemId: String): Option[ShopItemRow] =
    ShopTableSql.findItemById(connection, itemId)

  def listPurchasesByUser(connection: Connection, userId: String): Vector[ShopPurchaseRow] =
    ShopTableSql.listPurchasesByUser(connection, userId)

  def recordPurchase(connection: Connection, userId: String, item: ShopItemRow): ShopPurchaseRow =
    ShopTableSql.insertPurchase(
      connection,
      ShopPurchaseRow(
        id = ShopTableSql.nextPurchaseId(connection),
        userId = userId,
        itemId = item.id,
        price = item.price,
        currency = item.currency,
        purchasedAt = Instant.now().toString
      )
    )
}


private[tables] object ShopTableSql {

def listActiveItems(connection: Connection): Vector[ShopItemRow] = {
    val statement = connection.prepareStatement(
      s"${ShopItemTableCodec.baseSelect} WHERE active = TRUE ORDER BY catalog_index ASC, sort_order ASC, id ASC"
    )
    try {
      val resultSet = statement.executeQuery()
      try {
        val builder = Vector.newBuilder[ShopItemRow]
        while (resultSet.next()) {
          builder += ShopItemTableCodec.rowFromResultSet(resultSet)
        }
        builder.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def listAllItems(connection: Connection): Vector[ShopItemRow] = {
    val statement = connection.prepareStatement(
      s"${ShopItemTableCodec.baseSelect} ORDER BY catalog_index ASC, sort_order ASC, id ASC"
    )
    try {
      val resultSet = statement.executeQuery()
      try {
        val builder = Vector.newBuilder[ShopItemRow]
        while (resultSet.next()) {
          builder += ShopItemTableCodec.rowFromResultSet(resultSet)
        }
        builder.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def nextItemId(connection: Connection): String = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS item_count FROM shop_items")
    try {
      val resultSet = statement.executeQuery()
      try {
        val count = if (resultSet.next()) resultSet.getInt("item_count") else 0
        f"shop-item-${count + 1}%04d"
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def findItemById(connection: Connection, itemId: String): Option[ShopItemRow] = {
    val statement = connection.prepareStatement(s"${ShopItemTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, itemId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(ShopItemTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def listPurchasesByUser(connection: Connection, userId: String): Vector[ShopPurchaseRow] = {
    val statement = connection.prepareStatement(
      s"${ShopPurchaseTableCodec.baseSelect} WHERE user_id = ? ORDER BY purchased_at DESC, id DESC"
    )
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        val builder = Vector.newBuilder[ShopPurchaseRow]
        while (resultSet.next()) {
          builder += ShopPurchaseTableCodec.rowFromResultSet(resultSet)
        }
        builder.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def nextPurchaseId(connection: Connection): String = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS purchase_count FROM shop_purchases")
    try {
      val resultSet = statement.executeQuery()
      try {
        val count = if (resultSet.next()) resultSet.getInt("purchase_count") else 0
        f"purchase-${count + 1}%04d"
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

def insertItem(connection: Connection, row: ShopItemRow): ShopItemRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO shop_items (
          id, name, description, price, currency, catalog_index, active, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      """
    )
    try {
      ShopItemTableCodec.bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  def updateItem(connection: Connection, row: ShopItemRow): Option[ShopItemRow] =
    ShopTableSql.findItemById(connection, row.id).flatMap { _ =>
      val statement = connection.prepareStatement(
        """
          UPDATE shop_items SET
            name = ?, description = ?, price = ?, currency = ?,
            catalog_index = ?, active = ?, sort_order = ?, updated_at = ?
          WHERE id = ?
        """
      )
      try {
        statement.setString(1, row.name)
        statement.setString(2, row.description)
        statement.setInt(3, row.price)
        statement.setString(4, row.currency)
        statement.setInt(5, row.catalogIndex)
        statement.setBoolean(6, row.active)
        statement.setInt(7, row.sortOrder)
        statement.setString(8, row.updatedAt)
        statement.setString(9, row.id)
        if (statement.executeUpdate() > 0) Some(row) else None
      } finally {
        statement.close()
      }
    }

  def deactivateItem(connection: Connection, itemId: String): Option[ShopItemRow] =
    ShopTableSql.findItemById(connection, itemId).flatMap { existing =>
      val updated = existing.copy(active = false, updatedAt = java.time.Instant.now().toString)
      updateItem(connection, updated)
    }

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
