import { z } from "zod";

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
  scalingMode: ButtonTemplateScalingModeSchema,
  slice: ButtonTemplateSliceSchema,
  createdAt: z.string().min(1).optional(),
  updatedAt: z.string().min(1).optional(),
});
export type ButtonTemplate = z.infer<typeof ButtonTemplateSchema>;
