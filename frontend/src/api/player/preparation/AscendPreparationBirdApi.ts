import { PreparationStateSchema, type PlayerPreparationState } from "./PlayerPreparationSchemas.js";
import { APIWithTokenMessage } from "../../../system/api/APIWithTokenMessage.js";
import { sendAPI } from "../../../system/api/sendAPI.js";

export class AscendPreparationBirdAPI extends APIWithTokenMessage<PlayerPreparationState> {
  readonly birdType: string;

  constructor(userId: string, birdType: string) {
    super(userId);
    this.birdType = birdType;
  }

  override get responseSchema() {
    return PreparationStateSchema;
  }
}

export const ascendPlayerBird = (userId: string, birdType: string) =>
  sendAPI(new AscendPreparationBirdAPI(userId, birdType));
