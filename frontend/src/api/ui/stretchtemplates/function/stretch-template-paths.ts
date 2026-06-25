import type { StretchVisualTemplateKind } from "../../../../objects/ui/stretch_template/stretch-visual-template.js";

/** panel / pattern 两类拉伸视觉模板的后端路径前缀（与 Scala StretchVisualTemplate 路由一致）。 */
export const stretchTemplateApiPathByKind = {
  panel: "/admin/director/ui/panel-templates",
  pattern: "/admin/director/ui/pattern-templates",
} as const satisfies Record<StretchVisualTemplateKind, string>;

export const stretchTemplateApiPath = (kind: StretchVisualTemplateKind) =>
  stretchTemplateApiPathByKind[kind];

export const stretchTemplateItemApiPath = (kind: StretchVisualTemplateKind, templateId: string) =>
  `${stretchTemplateApiPathByKind[kind]}/${encodeURIComponent(templateId)}` as const;
