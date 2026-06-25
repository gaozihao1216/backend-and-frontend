import { DeleteUiPageRequestParamsSchema, DeleteUiPageResponseDataSchema, type UiPageConfig } from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";
import { normalizePageComponentIds } from "../../../objects/ui-customization/page-config-normalizer.js";

export const DeleteUiPageApiPath = "/admin/director/ui/pages" as const;

export class DeleteUiPageApi {
  static readonly path = DeleteUiPageApiPath;

  async execute(userId: string, pageId: string): Promise<UiPageConfig> {
    const params = DeleteUiPageRequestParamsSchema.parse({ pageId });
    const page = await request(`${DeleteUiPageApi.path}/${encodeURIComponent(params.pageId)}`, { method: "DELETE", headers: { "x-user-id": userId } }, DeleteUiPageResponseDataSchema);
    return normalizePageComponentIds(page);
  }
}

export const deleteUiPageApi = new DeleteUiPageApi();

export const deleteUiPage = async (userId: string, pageId: string): Promise<UiPageConfig> =>
  deleteUiPageApi.execute(userId, pageId);
