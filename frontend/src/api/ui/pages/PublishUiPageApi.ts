import { UpdateUiPageRequestBodySchema, UpdateUiPageRequestParamsSchema, UpdateUiPageResponseDataSchema, type UiPageConfig } from "../../api-contracts.js";
import { request } from "../../client.js";
import { normalizePageComponentIds } from "../../../objects/ui-customization/page-config-normalizer.js";

export const PublishUiPageApiPath = "/admin/director/ui/pages" as const;

export class PublishUiPageApi {
  static readonly path = PublishUiPageApiPath;

  async execute(userId: string, pageId: string, page: UiPageConfig): Promise<UiPageConfig> {
    const params = UpdateUiPageRequestParamsSchema.parse({ pageId });
    const normalizedPage = normalizePageComponentIds(page);
    const savedPage = await request(
      `${PublishUiPageApi.path}/${encodeURIComponent(params.pageId)}/publish`,
      {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify(UpdateUiPageRequestBodySchema.parse({ page: normalizedPage })),
      },
      UpdateUiPageResponseDataSchema,
    );
    return normalizePageComponentIds(savedPage);
  }
}

export const publishUiPageApi = new PublishUiPageApi();

export const publishUiPage = async (userId: string, pageId: string, page: UiPageConfig): Promise<UiPageConfig> =>
  publishUiPageApi.execute(userId, pageId, page);
