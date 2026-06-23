package microservice.player.tables.shop.jdbc

import java.sql.Connection
import microservice.player.tables.shop._

private[tables] object ShopTableJdbc {
def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS shop_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            price INTEGER NOT NULL,
            currency TEXT NOT NULL,
            catalog_index INTEGER NOT NULL DEFAULT 0,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        """
      )
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS shop_purchases (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            item_id TEXT NOT NULL REFERENCES shop_items(id),
            price INTEGER NOT NULL,
            currency TEXT NOT NULL,
            purchased_at TEXT NOT NULL
          )
        """
      )
      statement.executeUpdate(
        "CREATE INDEX IF NOT EXISTS shop_purchases_user_id_idx ON shop_purchases (user_id, purchased_at DESC)"
      )
      seedShopItems(statement)
    } finally {
      statement.close()
    }
  }

  private def seedShopItems(statement: java.sql.Statement): Unit = {
    val createdAt = "2026-06-03T00:00:00Z"
    val items = Vector(
      ("shop-scope", "精准瞄准镜", "下一次发射获得更稳定的落点辅助。", 120, "coins", 0, 1),
      ("shop-coupon", "双倍奖励券", "本日通关金币奖励翻倍一次。", 8, "gems", 0, 2),
      ("shop-steel", "钢羽皮肤", "为基础鸟解锁金属风格外观。", 260, "coins", 0, 3),
      ("shop-starter", "新手补给包", "包含金币、钻石和一次关卡复活机会。", 18, "gems", 0, 4),
      ("shop-booster", "爆裂推进器", "短时间提升冲击力，适合拆高塔关卡。", 420, "coins", 1, 1),
      ("shop-feather", "流光羽饰", "稀有外观部件，提升测试服收藏感。", 24, "gems", 1, 2),
      ("shop-crate", "工程物资箱", "解锁更多练习素材和试验配置。", 360, "coins", 1, 3),
      ("shop-vip", "测试员礼包", "内含钻石、金币和限定称号。", 32, "gems", 1, 4)
    )
    items.foreach { case (id, name, description, price, currency, catalogIndex, sortOrder) =>
      statement.executeUpdate(
        s"""
          INSERT INTO shop_items (id, name, description, price, currency, catalog_index, active, sort_order, created_at, updated_at)
          VALUES ('$id', '$name', '$description', $price, '$currency', $catalogIndex, TRUE, $sortOrder, '$createdAt', '$createdAt')
          ON CONFLICT (id) DO NOTHING
        """
      )
    }
  }

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
    ShopTableJdbc.findItemById(connection, row.id).flatMap { _ =>
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
    ShopTableJdbc.findItemById(connection, itemId).flatMap { existing =>
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
