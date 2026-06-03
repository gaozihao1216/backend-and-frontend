import { UnfavoriteLevelRequestParamsSchema, UnfavoriteLevelResponseDataSchema, type PlayerFavorite } from "../api-contracts.js";
import { request } from "../client.js";

export const unfavoriteLevelApiPath = (levelId: string) => `/player/levels/${levelId}/favorite` as const;

export class UnfavoriteLevelApi {
  path(levelId: string): string {
    return unfavoriteLevelApiPath(levelId);
  }

  async execute(userId: string, levelId: string): Promise<PlayerFavorite> {
    const params = UnfavoriteLevelRequestParamsSchema.parse({ levelId });
    return request(this.path(params.levelId), { method: "DELETE", headers: { "x-user-id": userId } }, UnfavoriteLevelResponseDataSchema);
  }
}

export const unfavoriteLevelApi = new UnfavoriteLevelApi();

export const unfavoriteLevel = async (userId: string, levelId: string): Promise<PlayerFavorite> =>
  unfavoriteLevelApi.execute(userId, levelId);
