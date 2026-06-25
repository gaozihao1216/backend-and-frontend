import type { ButtonTemplateCategory } from "../../../../objects/ui/category/template-category.js";

export type TemplateTab = "button" | "panel" | "pattern";

export type EditorMode = "create" | "update";

export type TemplateDraft = {
  id: string;
  name: string;
  sourceDataUrl: string;
  category: ButtonTemplateCategory;
  scalingMode: "fixedAspect" | "nineSlice";
  slice: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

export type SliceKey = keyof TemplateDraft["slice"];

export type ImageSize = {
  width: number;
  height: number;
};

export type ImageBounds = ImageSize & {
  x: number;
  y: number;
};

export const templateTabs: Array<{ id: TemplateTab; label: string }> = [
  { id: "button", label: "按钮模板" },
  { id: "panel", label: "面板模板" },
  { id: "pattern", label: "图案模板" },
];
