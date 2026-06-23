import { z } from "zod";

export const ButtonTemplateCategorySchema = z.enum(["business", "level"]);
export type ButtonTemplateCategory = z.infer<typeof ButtonTemplateCategorySchema>;

export const PanelTemplateCategorySchema = z.enum(["smallPanel", "levelBackground"]);
export type PanelTemplateCategory = z.infer<typeof PanelTemplateCategorySchema>;

export const PatternTemplateCategorySchema = z.enum(["diamond", "coin", "button", "level"]);
export type PatternTemplateCategory = z.infer<typeof PatternTemplateCategorySchema>;

export const BUTTON_TEMPLATE_CATEGORIES: ReadonlyArray<{
  id: ButtonTemplateCategory;
  label: string;
}> = [
  { id: "business", label: "业务类" },
  { id: "level", label: "关卡类" },
];

export const PANEL_TEMPLATE_CATEGORIES: ReadonlyArray<{
  id: PanelTemplateCategory;
  label: string;
}> = [
  { id: "smallPanel", label: "小面板类" },
  { id: "levelBackground", label: "关卡背景类" },
];

export const PATTERN_TEMPLATE_CATEGORIES: ReadonlyArray<{
  id: PatternTemplateCategory;
  label: string;
}> = [
  { id: "diamond", label: "钻石类" },
  { id: "coin", label: "金币类" },
  { id: "button", label: "按钮类" },
  { id: "level", label: "关卡类" },
];

export const DEFAULT_BUTTON_TEMPLATE_CATEGORY: ButtonTemplateCategory = "business";
export const DEFAULT_PANEL_TEMPLATE_CATEGORY: PanelTemplateCategory = "smallPanel";
export const DEFAULT_PATTERN_TEMPLATE_CATEGORY: PatternTemplateCategory = "button";

export const getButtonTemplateCategoryLabel = (category: ButtonTemplateCategory) =>
  BUTTON_TEMPLATE_CATEGORIES.find((entry) => entry.id === category)?.label ?? category;

export const getPanelTemplateCategoryLabel = (category: PanelTemplateCategory) =>
  PANEL_TEMPLATE_CATEGORIES.find((entry) => entry.id === category)?.label ?? category;

export const getPatternTemplateCategoryLabel = (category: PatternTemplateCategory) =>
  PATTERN_TEMPLATE_CATEGORIES.find((entry) => entry.id === category)?.label ?? category;

export const normalizeButtonTemplateCategory = (category: string | undefined): ButtonTemplateCategory =>
  ButtonTemplateCategorySchema.safeParse(category).success
    ? ButtonTemplateCategorySchema.parse(category)
    : DEFAULT_BUTTON_TEMPLATE_CATEGORY;

export const normalizePanelTemplateCategory = (category: string | undefined): PanelTemplateCategory =>
  PanelTemplateCategorySchema.safeParse(category).success
    ? PanelTemplateCategorySchema.parse(category)
    : DEFAULT_PANEL_TEMPLATE_CATEGORY;

export const normalizePatternTemplateCategory = (category: string | undefined): PatternTemplateCategory =>
  PatternTemplateCategorySchema.safeParse(category).success
    ? PatternTemplateCategorySchema.parse(category)
    : DEFAULT_PATTERN_TEMPLATE_CATEGORY;

export const normalizeStretchVisualTemplateCategory = (
  kind: "panel" | "pattern",
  category: string | undefined,
): PanelTemplateCategory | PatternTemplateCategory =>
  kind === "panel"
    ? normalizePanelTemplateCategory(category)
    : normalizePatternTemplateCategory(category);
