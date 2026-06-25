import { GetPublishedLevelRequestParamsSchema, GetPublishedLevelResponseDataSchema, type PublishedLevel } from "../../../../objects/api/api-contracts.js";
import { request } from "../../../../system/api/legacyRequest.js";

export const getPublishedLevelApiPath = (levelId: string) => `/player/levels/${levelId}` as const;

export class GetPublishedLevelApi {
  path(levelId: string): string {
    return getPublishedLevelApiPath(levelId);
  }

  async execute(userId: string, levelId: string): Promise<PublishedLevel> {
    const params = GetPublishedLevelRequestParamsSchema.parse({ levelId });
    return request(this.path(params.levelId), { method: "GET", headers: { "x-user-id": userId } }, GetPublishedLevelResponseDataSchema);
  }
}

export const getPublishedLevelApi = new GetPublishedLevelApi();

export const getPublishedLevel = async (userId: string, levelId: string): Promise<PublishedLevel> =>
  getPublishedLevelApi.execute(userId, levelId);
