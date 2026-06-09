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
