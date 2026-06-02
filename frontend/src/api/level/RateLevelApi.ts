import { RateLevelRequestBodySchema, RateLevelRequestParamsSchema, RateLevelResponseDataSchema, type LevelRating, type RateLevelRequestBody } from "../api-contracts.js";
import { request } from "../client.js";

export const rateLevel = async (userId: string, levelId: string, input: RateLevelRequestBody): Promise<LevelRating> =>
  request(`/player/levels/${RateLevelRequestParamsSchema.parse({ levelId }).levelId}/ratings`, { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(RateLevelRequestBodySchema.parse(input)) }, RateLevelResponseDataSchema);
