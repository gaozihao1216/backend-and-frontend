import { z } from "zod";
import { request } from "../client.js";

export const PlayerUiDataSchema = z.record(z.string(), z.unknown());

export class GetPlayerUiDataApi {
  static path(apiKey: string) {
    return `/player/ui/data/${encodeURIComponent(apiKey)}` as const;
  }

  async execute(userId: string, apiKey: string): Promise<Record<string, unknown>> {
    return request(
      GetPlayerUiDataApi.path(apiKey),
      { method: "GET", headers: { "x-user-id": userId } },
      PlayerUiDataSchema,
    );
  }
}

export const getPlayerUiDataApi = new GetPlayerUiDataApi();

export const getPlayerUiData = async (userId: string, apiKey: string) =>
  getPlayerUiDataApi.execute(userId, apiKey);
