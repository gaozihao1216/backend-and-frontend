import { RateLevelRequestBodySchema, RateLevelRequestParamsSchema, RateLevelResponseDataSchema, type LevelRating, type RateLevelRequestBody } from "../api-contracts.js";
import { request } from "../client.js";

export const rateLevelApiPath = (levelId: string) => `/player/levels/${levelId}/ratings` as const;

export const rateLevel = async (userId: string, levelId: string, input: RateLevelRequestBody): Promise<LevelRating> =>
  request(rateLevelApiPath(RateLevelRequestParamsSchema.parse({ levelId }).levelId), { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(RateLevelRequestBodySchema.parse(input)) }, RateLevelResponseDataSchema);
