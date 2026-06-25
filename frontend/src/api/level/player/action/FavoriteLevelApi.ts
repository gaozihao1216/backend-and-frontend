import { FavoriteLevelRequestParamsSchema, FavoriteLevelResponseDataSchema, type PlayerFavorite } from "../../../../objects/api/api-contracts.js";
import { request } from "../../../../system/api/legacyRequest.js";

export const favoriteLevelApiPath = (levelId: string) => `/player/levels/${levelId}/favorite` as const;

export class FavoriteLevelApi {
  path(levelId: string): string {
    return favoriteLevelApiPath(levelId);
  }

  async execute(userId: string, levelId: string): Promise<PlayerFavorite> {
    const params = FavoriteLevelRequestParamsSchema.parse({ levelId });
    return request(this.path(params.levelId), { method: "POST", headers: { "x-user-id": userId } }, FavoriteLevelResponseDataSchema);
  }
}

export const favoriteLevelApi = new FavoriteLevelApi();

export const favoriteLevel = async (userId: string, levelId: string): Promise<PlayerFavorite> =>
  favoriteLevelApi.execute(userId, levelId);
