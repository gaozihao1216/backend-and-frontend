import {
  ListAdminShopItemsRequestQuerySchema,
  ListAdminShopItemsResponseDataSchema,
  type ShopItem,
} from "../../api-contracts.js";
import { request } from "../../client.js";

export const ListAdminShopItemsApiPath = "/admin/shop/items" as const;

export class ListAdminShopItemsApi {
  static readonly path = ListAdminShopItemsApiPath;

  async execute(userId: string): Promise<ShopItem[]> {
    ListAdminShopItemsRequestQuerySchema.parse({});
    return request(ListAdminShopItemsApi.path, { method: "GET", headers: { "x-user-id": userId } }, ListAdminShopItemsResponseDataSchema);
  }
}

export const listAdminShopItemsApi = new ListAdminShopItemsApi();

export const listAdminShopItems = async (userId: string): Promise<ShopItem[]> =>
  listAdminShopItemsApi.execute(userId);
