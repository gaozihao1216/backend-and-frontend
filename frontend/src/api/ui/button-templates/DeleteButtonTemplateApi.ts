import { DeleteButtonTemplateRequestParamsSchema, DeleteButtonTemplateResponseDataSchema, type UiButtonTemplate } from "../../api-contracts.js";
import { request } from "../../client.js";

export const DeleteButtonTemplateApiPath = "/admin/director/ui/button-templates" as const;

export class DeleteButtonTemplateApi {
  static readonly path = DeleteButtonTemplateApiPath;

  async execute(userId: string, templateId: string): Promise<UiButtonTemplate> {
    const params = DeleteButtonTemplateRequestParamsSchema.parse({ templateId });
    return request(`${DeleteButtonTemplateApi.path}/${encodeURIComponent(params.templateId)}`, { method: "DELETE", headers: { "x-user-id": userId } }, DeleteButtonTemplateResponseDataSchema);
  }
}

export const deleteButtonTemplateApi = new DeleteButtonTemplateApi();

export const deleteButtonTemplate = async (userId: string, templateId: string): Promise<UiButtonTemplate> =>
  deleteButtonTemplateApi.execute(userId, templateId);
