import { FavoriteLevelRequestParamsSchema, FavoriteLevelResponseDataSchema, UnfavoriteLevelRequestParamsSchema, UnfavoriteLevelResponseDataSchema, type PlayerFavorite } from "../api-contracts.js";
import { request } from "../client.js";

export const favoriteLevel = async (userId: string, levelId: string): Promise<PlayerFavorite> =>
  request(`/player/levels/${FavoriteLevelRequestParamsSchema.parse({ levelId }).levelId}/favorite`, { method: "POST", headers: { "x-user-id": userId } }, FavoriteLevelResponseDataSchema);

export const unfavoriteLevel = async (userId: string, levelId: string): Promise<PlayerFavorite> =>
  request(`/player/levels/${UnfavoriteLevelRequestParamsSchema.parse({ levelId }).levelId}/favorite`, { method: "DELETE", headers: { "x-user-id": userId } }, UnfavoriteLevelResponseDataSchema);
