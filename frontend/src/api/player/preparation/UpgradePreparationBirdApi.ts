import { PreparationStateSchema, type PlayerPreparationState } from "../../../objects/player/preparation/player-preparation.js";
import { APIWithTokenMessage } from "../../../system/api/APIWithTokenMessage.js";
import { sendAPI } from "../../../system/api/sendAPI.js";

export class UpgradePreparationBirdAPI extends APIWithTokenMessage<PlayerPreparationState> {
  readonly birdType: string;

  constructor(userId: string, birdType: string) {
    super(userId);
    this.birdType = birdType;
  }

  override get responseSchema() {
    return PreparationStateSchema;
  }
}

export const upgradePlayerBird = (userId: string, birdType: string) =>
  sendAPI(new UpgradePreparationBirdAPI(userId, birdType));
