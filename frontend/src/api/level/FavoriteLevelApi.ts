import { FavoriteLevelRequestParamsSchema, FavoriteLevelResponseDataSchema, type PlayerFavorite } from "../api-contracts.js";
import { request } from "../client.js";

export const favoriteLevel = async (userId: string, levelId: string): Promise<PlayerFavorite> =>
  request(`/player/levels/${FavoriteLevelRequestParamsSchema.parse({ levelId }).levelId}/favorite`, { method: "POST", headers: { "x-user-id": userId } }, FavoriteLevelResponseDataSchema);
