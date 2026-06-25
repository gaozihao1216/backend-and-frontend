import { ListStretchVisualTemplatesResponseDataSchema, type UiStretchVisualTemplate } from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";
import type { StretchVisualTemplateKind } from "../../../objects/ui/stretch_template/stretch-visual-template.js";
import { stretchTemplateApiPath } from "./function/stretch-template-paths.js";

export class ListStretchVisualTemplatesApi {
  path(kind: StretchVisualTemplateKind): string {
    return stretchTemplateApiPath(kind);
  }

  async execute(userId: string, kind: StretchVisualTemplateKind): Promise<UiStretchVisualTemplate[]> {
    return request(
      this.path(kind),
      { method: "GET", headers: { "x-user-id": userId } },
      ListStretchVisualTemplatesResponseDataSchema,
    );
  }
}

export const listStretchVisualTemplatesApi = new ListStretchVisualTemplatesApi();
export const listStretchVisualTemplates = (userId: string, kind: StretchVisualTemplateKind) =>
  listStretchVisualTemplatesApi.execute(userId, kind);
