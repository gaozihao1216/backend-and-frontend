import { UpdateButtonTemplateRequestBodySchema, UpdateButtonTemplateRequestParamsSchema, UpdateButtonTemplateResponseDataSchema, type UiButtonTemplate } from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";

export const UpdateButtonTemplateApiPath = "/admin/director/ui/button-templates" as const;

export class UpdateButtonTemplateApi {
  static readonly path = UpdateButtonTemplateApiPath;

  async execute(userId: string, templateId: string, template: UiButtonTemplate): Promise<UiButtonTemplate> {
    const params = UpdateButtonTemplateRequestParamsSchema.parse({ templateId });
    return request(
      `${UpdateButtonTemplateApi.path}/${encodeURIComponent(params.templateId)}`,
      {
        method: "PUT",
        headers: { "x-user-id": userId },
        body: JSON.stringify(UpdateButtonTemplateRequestBodySchema.parse({ template })),
      },
      UpdateButtonTemplateResponseDataSchema,
    );
  }
}

export const updateButtonTemplateApi = new UpdateButtonTemplateApi();

export const updateButtonTemplate = async (userId: string, templateId: string, template: UiButtonTemplate): Promise<UiButtonTemplate> =>
  updateButtonTemplateApi.execute(userId, templateId, template);
