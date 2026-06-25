import { z } from "zod";
import { APIWithTokenMessage } from "../../../system/api/APIWithTokenMessage.js";
import { sendAPI } from "../../../system/api/sendAPI.js";

export const PlayerUiDataSchema = z.record(z.string(), z.unknown());

export class GetPlayerUiDataAPI extends APIWithTokenMessage<Record<string, unknown>> {
  readonly apiKey: string;
  readonly params: Record<string, string>;

  constructor(userId: string, apiKey: string, params: Record<string, string> = {}) {
    super(userId);
    this.apiKey = apiKey;
    this.params = params;
  }

  override get responseSchema() {
    return PlayerUiDataSchema;
  }
}

export const getPlayerUiData = async (
  userId: string,
  apiKey: string,
  params?: Record<string, string>,
) => sendAPI(new GetPlayerUiDataAPI(userId, apiKey, params));
