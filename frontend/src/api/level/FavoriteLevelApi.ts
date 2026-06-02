import { FavoriteLevelRequestParamsSchema, FavoriteLevelResponseDataSchema, type PlayerFavorite } from "../api-contracts.js";
import { request } from "../client.js";

export const favoriteLevelApiPath = (levelId: string) => `/player/levels/${levelId}/favorite` as const;

export const favoriteLevel = async (userId: string, levelId: string): Promise<PlayerFavorite> =>
  request(favoriteLevelApiPath(FavoriteLevelRequestParamsSchema.parse({ levelId }).levelId), { method: "POST", headers: { "x-user-id": userId } }, FavoriteLevelResponseDataSchema);
