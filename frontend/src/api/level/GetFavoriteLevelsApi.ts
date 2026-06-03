import { GetFavoriteLevelsRequestQuerySchema, GetFavoriteLevelsResponseDataSchema, type PlayerFavoriteWithLevel } from "../api-contracts.js";
import { request } from "../client.js";

export const GetFavoriteLevelsApiPath = "/player/favorites" as const;

export class GetFavoriteLevelsApi {
  static readonly path = GetFavoriteLevelsApiPath;

  async execute(userId: string): Promise<PlayerFavoriteWithLevel[]> {
    GetFavoriteLevelsRequestQuerySchema.parse({});
    return request(GetFavoriteLevelsApi.path, { method: "GET", headers: { "x-user-id": userId } }, GetFavoriteLevelsResponseDataSchema);
  }
}

export const getFavoriteLevelsApi = new GetFavoriteLevelsApi();

export const getFavoriteLevels = async (userId: string): Promise<PlayerFavoriteWithLevel[]> =>
  getFavoriteLevelsApi.execute(userId);
