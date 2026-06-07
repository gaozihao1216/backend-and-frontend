import {
  CreateStretchVisualTemplateRequestBodySchema,
  CreateStretchVisualTemplateResponseDataSchema,
  DeleteStretchVisualTemplateResponseDataSchema,
  ListStretchVisualTemplatesResponseDataSchema,
  UpdateStretchVisualTemplateRequestBodySchema,
  UpdateStretchVisualTemplateResponseDataSchema,
  type UiStretchVisualTemplate,
} from "../api-contracts.js";
import { request } from "../client.js";
import type { StretchVisualTemplateKind } from "../../objects/ui-customization/stretch-visual-template.js";

const apiPathByKind = {
  panel: "/admin/director/ui/panel-templates",
  pattern: "/admin/director/ui/pattern-templates",
} as const satisfies Record<StretchVisualTemplateKind, string>;

export const listStretchVisualTemplates = async (
  userId: string,
  kind: StretchVisualTemplateKind,
): Promise<UiStretchVisualTemplate[]> =>
  request(
    apiPathByKind[kind],
    { method: "GET", headers: { "x-user-id": userId } },
    ListStretchVisualTemplatesResponseDataSchema,
  );

export const createStretchVisualTemplate = async (
  userId: string,
  template: UiStretchVisualTemplate,
): Promise<UiStretchVisualTemplate> =>
  request(
    apiPathByKind[template.kind],
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(CreateStretchVisualTemplateRequestBodySchema.parse({ template })),
    },
    CreateStretchVisualTemplateResponseDataSchema,
  );

export const updateStretchVisualTemplate = async (
  userId: string,
  templateId: string,
  template: UiStretchVisualTemplate,
): Promise<UiStretchVisualTemplate> =>
  request(
    `${apiPathByKind[template.kind]}/${encodeURIComponent(templateId)}`,
    {
      method: "PUT",
      headers: { "x-user-id": userId },
      body: JSON.stringify(UpdateStretchVisualTemplateRequestBodySchema.parse({ template })),
    },
    UpdateStretchVisualTemplateResponseDataSchema,
  );

export const deleteStretchVisualTemplate = async (
  userId: string,
  kind: StretchVisualTemplateKind,
  templateId: string,
): Promise<UiStretchVisualTemplate> =>
  request(
    `${apiPathByKind[kind]}/${encodeURIComponent(templateId)}`,
    { method: "DELETE", headers: { "x-user-id": userId } },
    DeleteStretchVisualTemplateResponseDataSchema,
  );
