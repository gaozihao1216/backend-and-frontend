import { z } from "zod";
import { request } from "../../client.js";
import { PlayerUiDataSchema } from "./GetPlayerUiDataApi.js";

export const InvokePlayerUiActionRequestBodySchema = z.object({
  params: z.record(z.string(), z.string()).optional(),
});

export class InvokePlayerUiActionApi {
  static path(apiKey: string) {
    return `/player/ui/actions/${encodeURIComponent(apiKey)}` as const;
  }

  async execute(
    userId: string,
    apiKey: string,
    params?: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    return request(
      InvokePlayerUiActionApi.path(apiKey),
      {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify(InvokePlayerUiActionRequestBodySchema.parse({ params })),
      },
      PlayerUiDataSchema,
    );
  }
}

export const invokePlayerUiActionApi = new InvokePlayerUiActionApi();

export const invokePlayerUiAction = async (
  userId: string,
  apiKey: string,
  params?: Record<string, string>,
) => invokePlayerUiActionApi.execute(userId, apiKey, params);
