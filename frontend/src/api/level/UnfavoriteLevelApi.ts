import { UnfavoriteLevelRequestParamsSchema, UnfavoriteLevelResponseDataSchema, type PlayerFavorite } from "../api-contracts.js";
import { request } from "../client.js";

export const unfavoriteLevel = async (userId: string, levelId: string): Promise<PlayerFavorite> =>
  request(`/player/levels/${UnfavoriteLevelRequestParamsSchema.parse({ levelId }).levelId}/favorite`, { method: "DELETE", headers: { "x-user-id": userId } }, UnfavoriteLevelResponseDataSchema);
