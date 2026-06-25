import {
  DeactivateShopItemRequestParamsSchema,
  DeactivateShopItemResponseDataSchema,
  type ShopItem,
} from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";
import { ListAdminShopItemsApiPath } from "./ListAdminShopItemsApi.js";

export class DeactivateShopItemApi {
  static pathFor(itemId: string): string {
    DeactivateShopItemRequestParamsSchema.parse({ itemId });
    return `${ListAdminShopItemsApiPath}/${encodeURIComponent(itemId)}`;
  }

  async execute(userId: string, itemId: string): Promise<ShopItem> {
    return request(DeactivateShopItemApi.pathFor(itemId), {
      method: "DELETE",
      headers: { "x-user-id": userId },
    }, DeactivateShopItemResponseDataSchema);
  }
}

export const deactivateShopItemApi = new DeactivateShopItemApi();

export const deactivateShopItem = async (userId: string, itemId: string): Promise<ShopItem> =>
  deactivateShopItemApi.execute(userId, itemId);
