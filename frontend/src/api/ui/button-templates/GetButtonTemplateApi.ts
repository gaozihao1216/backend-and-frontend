import { GetButtonTemplateRequestParamsSchema, GetButtonTemplateResponseDataSchema, type UiButtonTemplate } from "../../api-contracts.js";
import { request } from "../../client.js";

export const GetButtonTemplateApiPath = "/admin/director/ui/button-templates" as const;

export class GetButtonTemplateApi {
  static readonly path = GetButtonTemplateApiPath;

  async execute(userId: string, templateId: string): Promise<UiButtonTemplate> {
    const params = GetButtonTemplateRequestParamsSchema.parse({ templateId });
    return request(`${GetButtonTemplateApi.path}/${encodeURIComponent(params.templateId)}`, { method: "GET", headers: { "x-user-id": userId } }, GetButtonTemplateResponseDataSchema);
  }
}

export const getButtonTemplateApi = new GetButtonTemplateApi();

export const getButtonTemplate = async (userId: string, templateId: string): Promise<UiButtonTemplate> =>
  getButtonTemplateApi.execute(userId, templateId);
