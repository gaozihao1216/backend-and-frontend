import { z } from "zod";
import {
  normalizeStretchVisualTemplateCategory,
  type PanelTemplateCategory,
  type PatternTemplateCategory,
} from "./template-category.js";

export const StretchVisualTemplateKindSchema = z.enum(["panel", "pattern"]);
export type StretchVisualTemplateKind = z.infer<typeof StretchVisualTemplateKindSchema>;

/** 面板/图案模板：统一采用整体拉伸（可压缩），不使用九宫格切片。 */
export const StretchVisualTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sourceDataUrl: z.string().min(1),
  kind: StretchVisualTemplateKindSchema,
  category: z.string().optional(),
  createdAt: z.string().min(1).optional(),
  updatedAt: z.string().min(1).optional(),
}).transform((template) => ({
  ...template,
  category: normalizeStretchVisualTemplateCategory(template.kind, template.category),
}));
export type StretchVisualTemplate = z.infer<typeof StretchVisualTemplateSchema>;
export type { PanelTemplateCategory, PatternTemplateCategory };

export const getDefaultStretchVisualTemplateCategory = (
  kind: StretchVisualTemplateKind,
): PanelTemplateCategory | PatternTemplateCategory =>
  normalizeStretchVisualTemplateCategory(kind, undefined);
