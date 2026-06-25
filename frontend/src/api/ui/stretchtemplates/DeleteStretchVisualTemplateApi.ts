import { DeleteStretchVisualTemplateResponseDataSchema, type UiStretchVisualTemplate } from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";
import type { StretchVisualTemplateKind } from "../../../objects/ui/stretch_template/stretch-visual-template.js";
import { stretchTemplateItemApiPath } from "../../../lib/ui/stretch-template-paths.js";

export class DeleteStretchVisualTemplateApi {
  path(kind: StretchVisualTemplateKind, templateId: string): string {
    return stretchTemplateItemApiPath(kind, templateId);
  }

  async execute(
    userId: string,
    kind: StretchVisualTemplateKind,
    templateId: string,
  ): Promise<UiStretchVisualTemplate> {
    return request(
      this.path(kind, templateId),
      { method: "DELETE", headers: { "x-user-id": userId } },
      DeleteStretchVisualTemplateResponseDataSchema,
    );
  }
}

export const deleteStretchVisualTemplateApi = new DeleteStretchVisualTemplateApi();
export const deleteStretchVisualTemplate = (
  userId: string,
  kind: StretchVisualTemplateKind,
  templateId: string,
) => deleteStretchVisualTemplateApi.execute(userId, kind, templateId);
