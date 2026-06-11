/** 商店表的 PostgreSQL DDL 与索引（JDBC 模式首次 initialize 时执行）。
  *
  * 关联：玩家模块 Table 门面在 JDBC 模式下 startup 时调用。
  */
package microservice.player.tables.shop.jdbc

import microservice.player.tables.shop._

import java.sql.Connection

private[tables] object ShopTableJdbcSchema {
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
}
