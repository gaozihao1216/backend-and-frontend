package microservice.admin.support.mapping

import microservice.admin.objects.shop.AdminShopItem
import microservice.player.objects.shop.ShopItem

/** player 模块 handoff → admin DTO（仅 support 层引用 player 类型）。 */
private[admin] object PlayerHandoffMapping {
  def toShopItem(item: ShopItem): AdminShopItem =
    AdminShopItem(
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
