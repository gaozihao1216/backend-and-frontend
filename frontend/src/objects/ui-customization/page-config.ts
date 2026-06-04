import { z } from "zod";

export const UiEndpointSchema = z.enum(["player", "designer", "admin", "director"]);
export type UiEndpoint = z.infer<typeof UiEndpointSchema>;

export const PageLayoutTypeSchema = z.enum(["stack", "grid", "freeform"]);
export type PageLayoutType = z.infer<typeof PageLayoutTypeSchema>;

export const PageLayoutSchema = z.object({
  type: PageLayoutTypeSchema,
  columns: z.number().int().positive().optional(),
  gap: z.number().min(0).optional(),
  padding: z.number().min(0).optional(),
});
export type PageLayout = z.infer<typeof PageLayoutSchema>;

export const ComponentPositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
});
export type ComponentPosition = z.infer<typeof ComponentPositionSchema>;

export const ComponentStyleSchema = z.object({
  variant: z.enum(["primary", "secondary", "ghost"]).optional(),
  backgroundColor: z.string().min(1).optional(),
  textColor: z.string().min(1).optional(),
  borderRadius: z.number().min(0).optional(),
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
  icon: z.string().min(1).optional(),
  position: ComponentPositionSchema,
  style: ComponentStyleSchema.optional(),
  action: ComponentActionSchema,
});
export type ButtonComponent = z.infer<typeof ButtonComponentSchema>;

export const PanelComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("panel"),
  title: z.string().min(1).optional(),
  position: ComponentPositionSchema,
  style: ComponentStyleSchema.optional(),
  childComponentIds: z.array(z.string().min(1)).default([]),
});
export type PanelComponent = z.infer<typeof PanelComponentSchema>;

export const TextComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("text"),
  text: z.string(),
  position: ComponentPositionSchema,
  style: ComponentStyleSchema.optional(),
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
