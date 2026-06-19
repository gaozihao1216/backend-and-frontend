import { request } from "../../client.js";
import { PreparationStateSchema, type PlayerPreparationState } from "./PlayerPreparationSchemas.js";

export const ascendPreparationBirdApiPath = (birdType: string) =>
  `/player/preparation/birds/${encodeURIComponent(birdType)}/ascend` as const;

export class AscendPreparationBirdApi {
  path(birdType: string): string {
    return ascendPreparationBirdApiPath(birdType);
  }

  async execute(userId: string, birdType: string): Promise<PlayerPreparationState> {
    return request(
      this.path(birdType),
      { method: "POST", headers: { "x-user-id": userId } },
      PreparationStateSchema,
    );
  }
}

export const ascendPreparationBirdApi = new AscendPreparationBirdApi();
export const ascendPlayerBird = (userId: string, birdType: string) =>
  ascendPreparationBirdApi.execute(userId, birdType);
