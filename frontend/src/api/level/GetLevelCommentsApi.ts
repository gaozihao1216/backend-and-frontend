import { GetLevelCommentsRequestParamsSchema, GetLevelCommentsResponseDataSchema, type LevelComment } from "../api-contracts.js";
import { request } from "../client.js";

export const getLevelComments = async (userId: string, levelId: string): Promise<LevelComment[]> =>
  request(`/player/levels/${GetLevelCommentsRequestParamsSchema.parse({ levelId }).levelId}/comments`, { method: "GET", headers: { "x-user-id": userId } }, GetLevelCommentsResponseDataSchema);
