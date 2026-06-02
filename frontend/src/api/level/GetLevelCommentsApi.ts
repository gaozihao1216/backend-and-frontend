import { GetLevelCommentsRequestParamsSchema, GetLevelCommentsResponseDataSchema, type LevelComment } from "../api-contracts.js";
import { request } from "../client.js";

export const getLevelCommentsApiPath = (levelId: string) => `/player/levels/${levelId}/comments` as const;

export const getLevelComments = async (userId: string, levelId: string): Promise<LevelComment[]> =>
  request(getLevelCommentsApiPath(GetLevelCommentsRequestParamsSchema.parse({ levelId }).levelId), { method: "GET", headers: { "x-user-id": userId } }, GetLevelCommentsResponseDataSchema);
