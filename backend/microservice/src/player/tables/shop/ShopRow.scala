/**
  *
   * 定义：ShopRow case class，与 DB 表列一一对应的存储层行模型。
 * 问题：API 对象不宜直接暴露 SQL 列布局，需 Row 作为持久化边界。
 * 作用：Table insert/find 的入参/出参；经 Mapper/Codec 与 objects 层转换。
 * 关联：同包 [[ShopTable]] 读写。
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
