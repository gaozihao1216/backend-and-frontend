import { UpdateUiPageRequestBodySchema, UpdateUiPageRequestParamsSchema, UpdateUiPageResponseDataSchema, type UiPageConfig } from "../../api-contracts.js";
import { request } from "../../client.js";
import { normalizePageComponentIds } from "../../../objects/ui-customization/page-config-normalizer.js";

export const UpdateUiPageApiPath = "/admin/director/ui/pages" as const;

export class UpdateUiPageApi {
  static readonly path = UpdateUiPageApiPath;

  async execute(userId: string, pageId: string, page: UiPageConfig): Promise<UiPageConfig> {
    const params = UpdateUiPageRequestParamsSchema.parse({ pageId });
    const normalizedPage = normalizePageComponentIds(page);
    const savedPage = await request(
      `${UpdateUiPageApi.path}/${encodeURIComponent(params.pageId)}`,
      {
        method: "PUT",
        headers: { "x-user-id": userId },
        body: JSON.stringify(UpdateUiPageRequestBodySchema.parse({ page: normalizedPage })),
      },
      UpdateUiPageResponseDataSchema,
    );
    return normalizePageComponentIds(savedPage);
  }
}

export const updateUiPageApi = new UpdateUiPageApi();

export const updateUiPage = async (userId: string, pageId: string, page: UiPageConfig): Promise<UiPageConfig> =>
  updateUiPageApi.execute(userId, pageId, page);
