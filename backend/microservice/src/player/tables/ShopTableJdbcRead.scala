package microservice.player.tables

import java.sql.Connection

private[tables] object ShopTableJdbcRead {
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
}
