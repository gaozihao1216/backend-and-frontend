import { request } from "../../client.js";
import { PreparationStateSchema, type PlayerPreparationState } from "./PlayerPreparationSchemas.js";

export const upgradePreparationBirdApiPath = (birdType: string) =>
  `/player/preparation/birds/${encodeURIComponent(birdType)}/upgrade` as const;

export class UpgradePreparationBirdApi {
  path(birdType: string): string {
    return upgradePreparationBirdApiPath(birdType);
  }

  async execute(userId: string, birdType: string): Promise<PlayerPreparationState> {
    return request(
      this.path(birdType),
      { method: "POST", headers: { "x-user-id": userId } },
      PreparationStateSchema,
    );
  }
}

export const upgradePreparationBirdApi = new UpgradePreparationBirdApi();
export const upgradePlayerBird = (userId: string, birdType: string) =>
  upgradePreparationBirdApi.execute(userId, birdType);
