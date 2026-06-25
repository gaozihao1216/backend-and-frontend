import { z } from "zod";
import { APIWithTokenMessage } from "../../../system/api/APIWithTokenMessage.js";
import { sendAPI } from "../../../system/api/sendAPI.js";
import { PlayerUiDataSchema } from "./GetPlayerUiDataApi.js";

export const InvokePlayerUiActionRequestBodySchema = z.object({
  params: z.record(z.string(), z.string()).optional(),
});

export class InvokePlayerUiActionAPI extends APIWithTokenMessage<Record<string, unknown>> {
  readonly apiKey: string;
  readonly params: Record<string, string>;

  constructor(userId: string, apiKey: string, params?: Record<string, string>) {
    super(userId);
    this.apiKey = apiKey;
    this.params = InvokePlayerUiActionRequestBodySchema.parse({ params }).params ?? {};
  }

  override get responseSchema() {
    return PlayerUiDataSchema;
  }
}

export const invokePlayerUiAction = async (
  userId: string,
  apiKey: string,
  params?: Record<string, string>,
) => sendAPI(new InvokePlayerUiActionAPI(userId, apiKey, params));
