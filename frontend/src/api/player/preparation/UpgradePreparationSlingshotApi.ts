import { request } from "../../client.js";
import { PreparationStateSchema, type PlayerPreparationState } from "./PlayerPreparationSchemas.js";

export const UpgradePreparationSlingshotApiPath = "/player/preparation/slingshot/upgrade" as const;

export class UpgradePreparationSlingshotApi {
  static readonly path = UpgradePreparationSlingshotApiPath;

  async execute(userId: string): Promise<PlayerPreparationState> {
    return request(
      UpgradePreparationSlingshotApi.path,
      { method: "POST", headers: { "x-user-id": userId } },
      PreparationStateSchema,
    );
  }
}

export const upgradePreparationSlingshotApi = new UpgradePreparationSlingshotApi();
export const upgradePlayerSlingshot = (userId: string) =>
  upgradePreparationSlingshotApi.execute(userId);
