import { z } from "zod";
import { request } from "../client.js";

export const PlayerUiDataSchema = z.record(z.string(), z.unknown());

export class GetPlayerUiDataApi {
  static path(apiKey: string, params?: Record<string, string>) {
    const search = params && Object.keys(params).length > 0
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return `/player/ui/data/${encodeURIComponent(apiKey)}${search}` as const;
  }

  async execute(
    userId: string,
    apiKey: string,
    params?: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    return request(
      GetPlayerUiDataApi.path(apiKey, params),
      { method: "GET", headers: { "x-user-id": userId } },
      PlayerUiDataSchema,
    );
  }
}

export const getPlayerUiDataApi = new GetPlayerUiDataApi();

export const getPlayerUiData = async (
  userId: string,
  apiKey: string,
  params?: Record<string, string>,
) => getPlayerUiDataApi.execute(userId, apiKey, params);
