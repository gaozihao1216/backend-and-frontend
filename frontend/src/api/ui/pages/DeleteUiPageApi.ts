import { DeleteUiPageRequestParamsSchema, DeleteUiPageResponseDataSchema, type UiPageConfig } from "../../api-contracts.js";
import { request } from "../../client.js";

export const DeleteUiPageApiPath = "/admin/director/ui/pages" as const;

export class DeleteUiPageApi {
  static readonly path = DeleteUiPageApiPath;

  async execute(userId: string, pageId: string): Promise<UiPageConfig> {
    const params = DeleteUiPageRequestParamsSchema.parse({ pageId });
    return request(`${DeleteUiPageApi.path}/${encodeURIComponent(params.pageId)}`, { method: "DELETE", headers: { "x-user-id": userId } }, DeleteUiPageResponseDataSchema);
  }
}

export const deleteUiPageApi = new DeleteUiPageApi();

export const deleteUiPage = async (userId: string, pageId: string): Promise<UiPageConfig> =>
  deleteUiPageApi.execute(userId, pageId);
