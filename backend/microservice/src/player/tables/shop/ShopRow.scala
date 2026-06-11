/** 商店表在存储层的行模型（与 PostgreSQL 表列一一对应）。
  *
  * 不直接作为 API 响应；经 RowMapper 转为 objects 包中的领域对象。
  */
package microservice.player.tables.shop

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
