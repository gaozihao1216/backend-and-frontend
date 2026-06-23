import {
  CreateShopItemRequestBodySchema,
  CreateShopItemResponseDataSchema,
  type CreateShopItemRequestBody,
  type ShopItem,
} from "../../api-contracts.js";
import { request } from "../../client.js";
import { ListAdminShopItemsApiPath } from "./ListAdminShopItemsApi.js";

export class CreateShopItemApi {
  static readonly path = ListAdminShopItemsApiPath;

  async execute(userId: string, body: CreateShopItemRequestBody): Promise<ShopItem> {
    CreateShopItemRequestBodySchema.parse(body);
    return request(CreateShopItemApi.path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify(body),
    }, CreateShopItemResponseDataSchema);
  }
}

export const createShopItemApi = new CreateShopItemApi();

export const createShopItem = async (userId: string, body: CreateShopItemRequestBody): Promise<ShopItem> =>
  createShopItemApi.execute(userId, body);
