import { GetPublishedLevelRequestParamsSchema, GetPublishedLevelResponseDataSchema, type PublishedLevel } from "../api-contracts.js";
import { request } from "../client.js";

export const getPublishedLevelApiPath = (levelId: string) => `/player/levels/${levelId}` as const;

export const getPublishedLevel = async (userId: string, levelId: string): Promise<PublishedLevel> =>
  request(getPublishedLevelApiPath(GetPublishedLevelRequestParamsSchema.parse({ levelId }).levelId), { method: "GET", headers: { "x-user-id": userId } }, GetPublishedLevelResponseDataSchema);
