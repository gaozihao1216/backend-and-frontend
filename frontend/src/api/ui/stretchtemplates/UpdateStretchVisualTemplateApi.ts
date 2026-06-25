import {
  UpdateStretchVisualTemplateRequestBodySchema,
  UpdateStretchVisualTemplateResponseDataSchema,
  type UiStretchVisualTemplate,
} from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";
import { stretchTemplateItemApiPath } from "./stretchTemplatePaths.js";

export class UpdateStretchVisualTemplateApi {
  path(templateId: string, template: UiStretchVisualTemplate): string {
    return stretchTemplateItemApiPath(template.kind, templateId);
  }

  async execute(
    userId: string,
    templateId: string,
    template: UiStretchVisualTemplate,
  ): Promise<UiStretchVisualTemplate> {
    return request(
      this.path(templateId, template),
      {
        method: "PUT",
        headers: { "x-user-id": userId },
        body: JSON.stringify(UpdateStretchVisualTemplateRequestBodySchema.parse({ template })),
      },
      UpdateStretchVisualTemplateResponseDataSchema,
    );
  }
}

export const updateStretchVisualTemplateApi = new UpdateStretchVisualTemplateApi();
export const updateStretchVisualTemplate = (
  userId: string,
  templateId: string,
  template: UiStretchVisualTemplate,
) => updateStretchVisualTemplateApi.execute(userId, templateId, template);
