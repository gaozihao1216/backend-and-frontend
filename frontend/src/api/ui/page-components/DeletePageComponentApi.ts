import { DeletePageComponentRequestParamsSchema, DeletePageComponentResponseDataSchema, type UiPageConfig } from "../../api-contracts.js";
import { request } from "../../client.js";

export const DeletePageComponentApiPath = "/admin/director/ui/pages" as const;

export class DeletePageComponentApi {
  static readonly path = DeletePageComponentApiPath;

  async execute(userId: string, pageId: string, componentId: string): Promise<UiPageConfig> {
    const params = DeletePageComponentRequestParamsSchema.parse({ pageId, componentId });
    return request(
      `${DeletePageComponentApi.path}/${encodeURIComponent(params.pageId)}/components/${encodeURIComponent(params.componentId)}`,
      { method: "DELETE", headers: { "x-user-id": userId } },
      DeletePageComponentResponseDataSchema,
    );
  }
}

export const deletePageComponentApi = new DeletePageComponentApi();

export const deletePageComponent = async (userId: string, pageId: string, componentId: string): Promise<UiPageConfig> =>
  deletePageComponentApi.execute(userId, pageId, componentId);
