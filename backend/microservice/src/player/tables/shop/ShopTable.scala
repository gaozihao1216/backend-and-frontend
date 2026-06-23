package microservice.player.tables.shop

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.player.tables.shop.jdbc.ShopTableJdbc

/**
  *
   * 定义：ShopTable 表访问门面，connection==null 走 in-memory，否则 JDBC。
 * 问题：player 持久化需双后端一致 API，避免 APIMessage 分支存储逻辑。
 * 作用：initialize/list/find/insert/update 等统一入口。
 * 关联：[[DatabaseSession]]；inmemory 与 jdbc 子包实现。
 */
object ShopTable {
  /** 启动时建表/种子数据。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) ShopTableJdbc.initialize(connection)
    else seedDefaultsInMemory()

  /** 返回全部上架商品。 */
  def listActiveItems(connection: Connection): Vector[ShopItemRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.shopItems.filter(_.active).sortBy(item => (item.catalogIndex, item.sortOrder, item.id))
    } else {
      ShopTableJdbc.listActiveItems(connection)
    }

  /** 返回全部商品（含下架），供管理员维护。 */
  def listAllItems(connection: Connection): Vector[ShopItemRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.shopItems.sortBy(item => (item.catalogIndex, item.sortOrder, item.id))
    } else {
      ShopTableJdbc.listAllItems(connection)
    }

  /** 生成下一个商品 ID。 */
  def nextItemId(connection: Connection): String =
    if (TableConnection.isInMemory(connection)) {
      f"shop-item-${InMemoryStore.shopItems.size + 1}%04d"
    } else {
      ShopTableJdbc.nextItemId(connection)
    }

  /** 插入新商品。 */
  def insertItem(connection: Connection, row: ShopItemRow): ShopItemRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.shopItems = InMemoryStore.shopItems :+ row
      row
    } else {
      ShopTableJdbc.insertItem(connection, row)
    }

  /** 更新商品（按 id 全量覆盖）。 */
  def updateItem(connection: Connection, row: ShopItemRow): Option[ShopItemRow] =
    if (TableConnection.isInMemory(connection)) {
      if (!InMemoryStore.shopItems.exists(_.id == row.id)) None
      else {
        InMemoryStore.shopItems = InMemoryStore.shopItems.filterNot(_.id == row.id) :+ row
        Some(row)
      }
    } else {
      ShopTableJdbc.updateItem(connection, row)
    }

  /** 下架商品（active=false）；已有购买记录时仍保留行。 */
  def deactivateItem(connection: Connection, itemId: String): Option[ShopItemRow] =
    if (TableConnection.isInMemory(connection)) {
      findItemById(connection, itemId).map { existing =>
        val updated = existing.copy(active = false, updatedAt = Instant.now().toString)
        InMemoryStore.shopItems = InMemoryStore.shopItems.filterNot(_.id == itemId) :+ updated
        updated
      }
    } else {
      ShopTableJdbc.deactivateItem(connection, itemId)
    }

  /** 按 itemId 查找商品（购买前校验）。 */
  def findItemById(connection: Connection, itemId: String): Option[ShopItemRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.shopItems.find(_.id == itemId)
    } else {
      ShopTableJdbc.findItemById(connection, itemId)
    }

  /** 返回用户全部购买记录（前端用于标记已购商品）。 */
  def listPurchasesByUser(connection: Connection, userId: String): Vector[ShopPurchaseRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.shopPurchases.filter(_.userId == userId).sortBy(row => (row.purchasedAt, row.id)).reverse
    } else {
      ShopTableJdbc.listPurchasesByUser(connection, userId)
    }

  /** 记录一次购买并返回购买行（含自动生成的 purchase id）。 */
  def recordPurchase(connection: Connection, userId: String, item: ShopItemRow): ShopPurchaseRow = {
    val row = ShopPurchaseRow(
      id =
        if (TableConnection.isInMemory(connection)) f"purchase-${InMemoryStore.shopPurchases.size + 1}%04d"
        else ShopTableJdbc.nextPurchaseId(connection),
      userId = userId,
      itemId = item.id,
      price = item.price,
      currency = item.currency,
      purchasedAt = Instant.now().toString
    )
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.shopPurchases = InMemoryStore.shopPurchases :+ row
      row
    } else {
      ShopTableJdbc.insertPurchase(connection, row)
    }
  }

  private def seedDefaultsInMemory(): Unit =
    if (InMemoryStore.shopItems.isEmpty) {
      val createdAt = "2026-06-03T00:00:00Z"
      InMemoryStore.shopItems = Vector(
        ShopItemRow("shop-scope", "精准瞄准镜", "下一次发射获得更稳定的落点辅助。", 120, "coins", 0, true, 1, createdAt, createdAt),
        ShopItemRow("shop-coupon", "双倍奖励券", "本日通关金币奖励翻倍一次。", 8, "gems", 0, true, 2, createdAt, createdAt),
        ShopItemRow("shop-steel", "钢羽皮肤", "为基础鸟解锁金属风格外观。", 260, "coins", 0, true, 3, createdAt, createdAt),
        ShopItemRow("shop-starter", "新手补给包", "包含金币、钻石和一次关卡复活机会。", 18, "gems", 0, true, 4, createdAt, createdAt),
        ShopItemRow("shop-booster", "爆裂推进器", "短时间提升冲击力，适合拆高塔关卡。", 420, "coins", 1, true, 1, createdAt, createdAt),
        ShopItemRow("shop-feather", "流光羽饰", "稀有外观部件，提升测试服收藏感。", 24, "gems", 1, true, 2, createdAt, createdAt),
        ShopItemRow("shop-crate", "工程物资箱", "解锁更多练习素材和试验配置。", 360, "coins", 1, true, 3, createdAt, createdAt),
        ShopItemRow("shop-vip", "测试员礼包", "内含钻石、金币和限定称号。", 32, "gems", 1, true, 4, createdAt, createdAt)
      )
    }
}
