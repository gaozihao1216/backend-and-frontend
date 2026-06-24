package microservice.player.tables.shop

import microservice.player.objects.shop.ShopItem

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
