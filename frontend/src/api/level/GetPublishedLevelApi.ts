import { GetPublishedLevelRequestParamsSchema, GetPublishedLevelResponseDataSchema, type PublishedLevel } from "../api-contracts.js";
import { request } from "../client.js";

export const getPublishedLevel = async (userId: string, levelId: string): Promise<PublishedLevel> =>
  request(`/player/levels/${GetPublishedLevelRequestParamsSchema.parse({ levelId }).levelId}`, { method: "GET", headers: { "x-user-id": userId } }, GetPublishedLevelResponseDataSchema);
