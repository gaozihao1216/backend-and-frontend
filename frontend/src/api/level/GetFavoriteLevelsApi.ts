import { GetFavoriteLevelsRequestQuerySchema, GetFavoriteLevelsResponseDataSchema, type PlayerFavoriteWithLevel } from "../api-contracts.js";
import { request } from "../client.js";

export const getFavoriteLevels = async (userId: string): Promise<PlayerFavoriteWithLevel[]> => {
  GetFavoriteLevelsRequestQuerySchema.parse({});
  return request("/player/favorites", { method: "GET", headers: { "x-user-id": userId } }, GetFavoriteLevelsResponseDataSchema);
};
