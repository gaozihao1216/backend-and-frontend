import { PreparationStateSchema, type PlayerPreparationState } from "../../../objects/player/preparation/player-preparation.js";
import { APIWithTokenMessage } from "../../../system/api/APIWithTokenMessage.js";
import { sendAPI } from "../../../system/api/sendAPI.js";

export class GetPreparationStateAPI extends APIWithTokenMessage<PlayerPreparationState> {
  override get responseSchema() {
    return PreparationStateSchema;
  }
}

export const getPlayerPreparation = (userId: string) => sendAPI(new GetPreparationStateAPI(userId));
