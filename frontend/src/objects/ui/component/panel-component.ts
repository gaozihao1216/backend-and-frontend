import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { ComponentBindingSchema, UiDataSourceSchema } from "./component-binding.js";
import { ComponentPositionSchema } from "./component-position.js";
import { ComponentStyleSchema, ComponentVisualEffectSchema } from "./component-style.js";
import { PanelDecorationSchema } from "./stretch-visual-design.js";

export const PanelKindSchema = z.enum(["container", "surface", "stage", "group", "overlay"]);
export type PanelKind = z.infer<typeof PanelKindSchema>;

export const PanelContentSizeSchema = z.object({
  widthPercent: z.number().positive(),
  heightPercent: z.number().positive(),
});
export type PanelContentSize = z.infer<typeof PanelContentSizeSchema>;

export const LevelMapPathPointSchema = z.object({
  x: z.number().min(-25).max(175),
  y: z.number().min(-25).max(175),
});
export type LevelMapPathPoint = z.infer<typeof LevelMapPathPointSchema>;

export const LevelMapPathEdgeStyleTemplateSchema = z.enum(["plank", "rope", "dashed"]);
export type LevelMapPathEdgeStyleTemplate = z.infer<typeof LevelMapPathEdgeStyleTemplateSchema>;

export const LevelMapPathEdgeSchema = z.object({
  id: z.string().min(1),
  fromSuffix: z.string().min(1),
  toSuffix: z.string().min(1),
  waypoints: nullishToUndefined(z.array(LevelMapPathPointSchema)),
  style: nullishToUndefined(z.object({
    templateId: LevelMapPathEdgeStyleTemplateSchema.default("plank"),
    width: nullishToUndefined(z.number().positive().max(12)),
  })),
});
export type LevelMapPathEdge = z.infer<typeof LevelMapPathEdgeSchema>;

export const LevelMapPathDesignSchema = z.object({
  edges: z.array(LevelMapPathEdgeSchema).default([]),
});
export type LevelMapPathDesign = z.infer<typeof LevelMapPathDesignSchema>;

export const PanelFloatingSchema = z.object({
  anchorComponentId: z.string().min(1),
  placement: z.enum(["top", "right", "bottom", "left", "center"]),
  offsetX: z.number(),
  offsetY: z.number(),
});
export type PanelFloating = z.infer<typeof PanelFloatingSchema>;

export const PanelComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("panel"),
  kind: nullishToUndefined(PanelKindSchema),
  panelRole: nullishToUndefined(z.enum(["static", "popover", "dataPanel", "workflowPanel"])),
  title: nullishToUndefined(z.string().min(1)),
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
  decoration: nullishToUndefined(PanelDecorationSchema),
  effect: nullishToUndefined(ComponentVisualEffectSchema),
  contentSize: nullishToUndefined(PanelContentSizeSchema),
  pathDesign: nullishToUndefined(LevelMapPathDesignSchema),
  floating: nullishToUndefined(PanelFloatingSchema),
  dataSource: nullishToUndefined(UiDataSourceSchema),
  binding: nullishToUndefined(ComponentBindingSchema),
  childComponentIds: z.array(z.string().min(1)).default([]),
});
export type PanelComponent = z.infer<typeof PanelComponentSchema>;
