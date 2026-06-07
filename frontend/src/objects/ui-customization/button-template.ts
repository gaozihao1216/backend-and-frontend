import { z } from "zod";
import {
  ButtonTemplateCategorySchema,
  DEFAULT_BUTTON_TEMPLATE_CATEGORY,
  type ButtonTemplateCategory,
} from "./template-category.js";

export const ButtonTemplateSliceSchema = z.object({
  top: z.number().min(0),
  right: z.number().min(0),
  bottom: z.number().min(0),
  left: z.number().min(0),
});
export type ButtonTemplateSlice = z.infer<typeof ButtonTemplateSliceSchema>;

export const ButtonTemplateScalingModeSchema = z.enum(["fixedAspect", "nineSlice"]).default("fixedAspect");
export type ButtonTemplateScalingMode = z.infer<typeof ButtonTemplateScalingModeSchema>;

export const ButtonTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sourceDataUrl: z.string().min(1),
  category: ButtonTemplateCategorySchema.default(DEFAULT_BUTTON_TEMPLATE_CATEGORY),
  scalingMode: ButtonTemplateScalingModeSchema,
  slice: ButtonTemplateSliceSchema,
  createdAt: z.string().min(1).optional(),
  updatedAt: z.string().min(1).optional(),
});
export type ButtonTemplate = z.infer<typeof ButtonTemplateSchema>;
export type { ButtonTemplateCategory };
