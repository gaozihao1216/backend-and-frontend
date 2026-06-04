import { z } from "zod";
import { nullishToUndefined } from "../system/schema-utils.js";

export const UiEndpointSchema = z.enum(["player", "designer", "admin", "director"]);
export type UiEndpoint = z.infer<typeof UiEndpointSchema>;

export const PageLayoutTypeSchema = z.enum(["stack", "grid", "freeform"]);
export type PageLayoutType = z.infer<typeof PageLayoutTypeSchema>;

export const PageLayoutSchema = z.object({
  type: PageLayoutTypeSchema,
  columns: nullishToUndefined(z.number().int().positive()),
  gap: nullishToUndefined(z.number().min(0)),
  padding: nullishToUndefined(z.number().min(0)),
});
export type PageLayout = z.infer<typeof PageLayoutSchema>;

export const ComponentPositionUnitSchema = z.enum(["percent", "px"]);
export type ComponentPositionUnit = z.infer<typeof ComponentPositionUnitSchema>;

export const ComponentPositionSchema = z.object({
  unit: ComponentPositionUnitSchema.default("percent"),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
});
export type ComponentPosition = z.infer<typeof ComponentPositionSchema>;

export const ComponentStyleSchema = z.object({
  variant: nullishToUndefined(z.enum(["primary", "secondary", "ghost"])),
  backgroundColor: nullishToUndefined(z.string().min(1)),
  textColor: nullishToUndefined(z.string().min(1)),
  borderRadius: nullishToUndefined(z.number().min(0)),
  fontSize: nullishToUndefined(z.number().positive()),
});
export type ComponentStyle = z.infer<typeof ComponentStyleSchema>;

export const NavigateActionSchema = z.object({
  type: z.literal("navigate"),
  targetPageId: z.string().min(1),
  targetPath: z.string().min(1),
});

export const OpenPanelActionSchema = z.object({
  type: z.literal("openPanel"),
  panelId: z.string().min(1),
});

export const OpenModalActionSchema = z.object({
  type: z.literal("openModal"),
  modalId: z.string().min(1),
});

export const NoopActionSchema = z.object({
  type: z.literal("none"),
});

export const ComponentActionSchema = z.discriminatedUnion("type", [
  NavigateActionSchema,
  OpenPanelActionSchema,
  OpenModalActionSchema,
  NoopActionSchema,
]);
export type ComponentAction = z.infer<typeof ComponentActionSchema>;

export const ButtonComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("button"),
  label: z.string().min(1),
  icon: nullishToUndefined(z.string().min(1)),
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
  action: ComponentActionSchema,
});
export type ButtonComponent = z.infer<typeof ButtonComponentSchema>;

export const PanelKindSchema = z.enum(["container", "surface", "stage", "group", "overlay"]);
export type PanelKind = z.infer<typeof PanelKindSchema>;

export const PanelComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("panel"),
  kind: nullishToUndefined(PanelKindSchema),
  title: nullishToUndefined(z.string().min(1)),
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
  childComponentIds: z.array(z.string().min(1)).default([]),
});
export type PanelComponent = z.infer<typeof PanelComponentSchema>;

export const TextComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("text"),
  text: z.string(),
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
});
export type TextComponent = z.infer<typeof TextComponentSchema>;

export const PageComponentSchema = z.discriminatedUnion("type", [
  ButtonComponentSchema,
  PanelComponentSchema,
  TextComponentSchema,
]);
export type PageComponent = z.infer<typeof PageComponentSchema>;

export const PageConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  path: z.string().min(1),
  roleScope: UiEndpointSchema,
  layout: PageLayoutSchema,
  components: z.array(PageComponentSchema),
});
export type PageConfig = z.infer<typeof PageConfigSchema>;
