import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";

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

export const ApiActionSchema = z.object({
  type: z.literal("apiAction"),
  apiKey: z.string().min(1),
  params: nullishToUndefined(z.record(z.string(), z.string())),
  afterSuccess: nullishToUndefined(z.unknown()),
});

export const ClosePanelActionSchema = z.object({
  type: z.literal("closePanel"),
  panelId: nullishToUndefined(z.string().min(1)),
});

export const NoopActionSchema = z.object({
  type: z.literal("none"),
});

export const OpenSettingsActionSchema = z.object({
  type: z.literal("openSettings"),
});

export const LogoutActionSchema = z.object({
  type: z.literal("logout"),
});

export const ComponentActionSchema = z.discriminatedUnion("type", [
  NavigateActionSchema,
  OpenPanelActionSchema,
  OpenModalActionSchema,
  ApiActionSchema,
  ClosePanelActionSchema,
  OpenSettingsActionSchema,
  LogoutActionSchema,
  NoopActionSchema,
]);
export type ComponentAction = z.infer<typeof ComponentActionSchema>;
