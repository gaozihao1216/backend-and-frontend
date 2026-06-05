import { UpdateUiPageRequestBodySchema, UpdateUiPageRequestParamsSchema, UpdateUiPageResponseDataSchema, type UiPageConfig } from "../../api-contracts.js";
import { request } from "../../client.js";

export const UpdateUiPageApiPath = "/admin/director/ui/pages" as const;

export class UpdateUiPageApi {
  static readonly path = UpdateUiPageApiPath;

  async execute(userId: string, pageId: string, page: UiPageConfig): Promise<UiPageConfig> {
    const params = UpdateUiPageRequestParamsSchema.parse({ pageId });
    return request(
      `${UpdateUiPageApi.path}/${encodeURIComponent(params.pageId)}`,
      {
        method: "PUT",
        headers: { "x-user-id": userId },
        body: JSON.stringify(UpdateUiPageRequestBodySchema.parse({ page })),
      },
      UpdateUiPageResponseDataSchema,
    );
  }
}

export const updateUiPageApi = new UpdateUiPageApi();

export const updateUiPage = async (userId: string, pageId: string, page: UiPageConfig): Promise<UiPageConfig> =>
  updateUiPageApi.execute(userId, pageId, page);
