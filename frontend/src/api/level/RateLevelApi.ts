import { RateLevelRequestBodySchema, RateLevelRequestParamsSchema, RateLevelResponseDataSchema, type LevelRating, type RateLevelRequestBody } from "../api-contracts.js";
import { request } from "../client.js";

export const rateLevelApiPath = (levelId: string) => `/player/levels/${levelId}/ratings` as const;

export class RateLevelApi {
  path(levelId: string): string {
    return rateLevelApiPath(levelId);
  }

  async execute(userId: string, levelId: string, input: RateLevelRequestBody): Promise<LevelRating> {
    const params = RateLevelRequestParamsSchema.parse({ levelId });
    return request(
      this.path(params.levelId),
      { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(RateLevelRequestBodySchema.parse(input)) },
      RateLevelResponseDataSchema,
    );
  }
}

export const rateLevelApi = new RateLevelApi();

export const rateLevel = async (userId: string, levelId: string, input: RateLevelRequestBody): Promise<LevelRating> =>
  rateLevelApi.execute(userId, levelId, input);
