import {
  CreateStretchVisualTemplateRequestBodySchema,
  CreateStretchVisualTemplateResponseDataSchema,
  type UiStretchVisualTemplate,
} from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";
import { stretchTemplateApiPath } from "./function/stretch-template-paths.js";

export class CreateStretchVisualTemplateApi {
  path(template: UiStretchVisualTemplate): string {
    return stretchTemplateApiPath(template.kind);
  }

  async execute(userId: string, template: UiStretchVisualTemplate): Promise<UiStretchVisualTemplate> {
    return request(
      this.path(template),
      {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify(CreateStretchVisualTemplateRequestBodySchema.parse({ template })),
      },
      CreateStretchVisualTemplateResponseDataSchema,
    );
  }
}

export const createStretchVisualTemplateApi = new CreateStretchVisualTemplateApi();
export const createStretchVisualTemplate = (userId: string, template: UiStretchVisualTemplate) =>
  createStretchVisualTemplateApi.execute(userId, template);
