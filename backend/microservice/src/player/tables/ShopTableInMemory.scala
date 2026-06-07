package microservice.player.tables

import microservice.infrastructure.database.InMemoryStore

private[tables] object ShopTableInMemory {
  def listActiveItems(): Vector[ShopItemRow] =
    InMemoryStore.shopItems.filter(_.active).sortBy(item => (item.catalogIndex, item.sortOrder, item.id))

  def findItemById(itemId: String): Option[ShopItemRow] =
    InMemoryStore.shopItems.find(_.id == itemId)

  def listPurchasesByUser(userId: String): Vector[ShopPurchaseRow] =
    InMemoryStore.shopPurchases.filter(_.userId == userId).sortBy(row => (row.purchasedAt, row.id)).reverse

  def nextPurchaseId(): String = {
    val count = InMemoryStore.shopPurchases.size
    f"purchase-${count + 1}%04d"
  }

  def insertPurchase(row: ShopPurchaseRow): ShopPurchaseRow = {
    InMemoryStore.shopPurchases = InMemoryStore.shopPurchases :+ row
    row
  }

  def seedDefaults(): Unit =
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
