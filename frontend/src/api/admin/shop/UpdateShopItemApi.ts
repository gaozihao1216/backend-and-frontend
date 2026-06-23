import {
  UpdateShopItemRequestBodySchema,
  UpdateShopItemRequestParamsSchema,
  UpdateShopItemResponseDataSchema,
  type ShopItem,
  type UpdateShopItemRequestBody,
} from "../../api-contracts.js";
import { request } from "../../client.js";
import { ListAdminShopItemsApiPath } from "./ListAdminShopItemsApi.js";

export class UpdateShopItemApi {
  static pathFor(itemId: string): string {
    UpdateShopItemRequestParamsSchema.parse({ itemId });
    return `${ListAdminShopItemsApiPath}/${encodeURIComponent(itemId)}`;
  }

  async execute(userId: string, itemId: string, body: UpdateShopItemRequestBody): Promise<ShopItem> {
    UpdateShopItemRequestBodySchema.parse(body);
    return request(UpdateShopItemApi.pathFor(itemId), {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify(body),
    }, UpdateShopItemResponseDataSchema);
  }
}

export const updateShopItemApi = new UpdateShopItemApi();

export const updateShopItem = async (
  userId: string,
  itemId: string,
  body: UpdateShopItemRequestBody,
): Promise<ShopItem> => updateShopItemApi.execute(userId, itemId, body);
