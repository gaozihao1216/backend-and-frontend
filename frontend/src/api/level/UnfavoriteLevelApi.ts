import { UnfavoriteLevelRequestParamsSchema, UnfavoriteLevelResponseDataSchema, type PlayerFavorite } from "../api-contracts.js";
import { request } from "../client.js";

export const unfavoriteLevelApiPath = (levelId: string) => `/player/levels/${levelId}/favorite` as const;

export const unfavoriteLevel = async (userId: string, levelId: string): Promise<PlayerFavorite> =>
  request(unfavoriteLevelApiPath(UnfavoriteLevelRequestParamsSchema.parse({ levelId }).levelId), { method: "DELETE", headers: { "x-user-id": userId } }, UnfavoriteLevelResponseDataSchema);
