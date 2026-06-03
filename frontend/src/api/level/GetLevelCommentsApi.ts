import { GetLevelCommentsRequestParamsSchema, GetLevelCommentsResponseDataSchema, type LevelComment } from "../api-contracts.js";
import { request } from "../client.js";

export const getLevelCommentsApiPath = (levelId: string) => `/player/levels/${levelId}/comments` as const;

export class GetLevelCommentsApi {
  path(levelId: string): string {
    return getLevelCommentsApiPath(levelId);
  }

  async execute(userId: string, levelId: string): Promise<LevelComment[]> {
    const params = GetLevelCommentsRequestParamsSchema.parse({ levelId });
    return request(this.path(params.levelId), { method: "GET", headers: { "x-user-id": userId } }, GetLevelCommentsResponseDataSchema);
  }
}

export const getLevelCommentsApi = new GetLevelCommentsApi();

export const getLevelComments = async (userId: string, levelId: string): Promise<LevelComment[]> =>
  getLevelCommentsApi.execute(userId, levelId);
