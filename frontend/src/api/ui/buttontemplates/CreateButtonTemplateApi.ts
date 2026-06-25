import { CreateButtonTemplateRequestBodySchema, CreateButtonTemplateResponseDataSchema, type UiButtonTemplate } from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";

export const CreateButtonTemplateApiPath = "/admin/director/ui/button-templates" as const;

export class CreateButtonTemplateApi {
  static readonly path = CreateButtonTemplateApiPath;

  async execute(userId: string, template: UiButtonTemplate): Promise<UiButtonTemplate> {
    return request(
      CreateButtonTemplateApi.path,
      {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify(CreateButtonTemplateRequestBodySchema.parse({ template })),
      },
      CreateButtonTemplateResponseDataSchema,
    );
  }
}

export const createButtonTemplateApi = new CreateButtonTemplateApi();

export const createButtonTemplate = async (userId: string, template: UiButtonTemplate): Promise<UiButtonTemplate> =>
  createButtonTemplateApi.execute(userId, template);
