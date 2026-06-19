import { ListStretchVisualTemplatesResponseDataSchema, type UiStretchVisualTemplate } from "../../api-contracts.js";
import { request } from "../../client.js";
import type { StretchVisualTemplateKind } from "../../../objects/ui-customization/stretch-visual-template.js";
import { stretchTemplateApiPath } from "./stretchTemplatePaths.js";

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
