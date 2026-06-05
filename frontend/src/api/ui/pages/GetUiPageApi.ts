import { GetUiPageRequestParamsSchema, GetUiPageResponseDataSchema, type UiPageConfig } from "../../api-contracts.js";
import { request } from "../../client.js";

export const GetUiPageApiPath = "/admin/director/ui/pages" as const;

export class GetUiPageApi {
  static readonly path = GetUiPageApiPath;

  async execute(userId: string, pageId: string): Promise<UiPageConfig> {
    const params = GetUiPageRequestParamsSchema.parse({ pageId });
    return request(`${GetUiPageApi.path}/${encodeURIComponent(params.pageId)}`, { method: "GET", headers: { "x-user-id": userId } }, GetUiPageResponseDataSchema);
  }
}

export const getUiPageApi = new GetUiPageApi();

export const getUiPage = async (userId: string, pageId: string): Promise<UiPageConfig> =>
  getUiPageApi.execute(userId, pageId);
