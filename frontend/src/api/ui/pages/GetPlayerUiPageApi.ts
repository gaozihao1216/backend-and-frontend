import { GetUiPageResponseDataSchema, UpdateUiPageRequestBodySchema, type UiPageConfig } from "../../api-contracts.js";
import { request } from "../../client.js";

export const GetPlayerUiPageApiPath = "/player/ui/pages" as const;

export class GetPlayerUiPageApi {
  static readonly path = GetPlayerUiPageApiPath;

  async execute(userId: string, pageId: string): Promise<UiPageConfig> {
    return request(
      `${GetPlayerUiPageApi.path}/${encodeURIComponent(pageId)}`,
      { method: "GET", headers: { "x-user-id": userId } },
      GetUiPageResponseDataSchema,
    );
  }
}

export const getPlayerUiPageApi = new GetPlayerUiPageApi();

export const getPlayerUiPage = async (userId: string, pageId: string): Promise<UiPageConfig> =>
  getPlayerUiPageApi.execute(userId, pageId);
