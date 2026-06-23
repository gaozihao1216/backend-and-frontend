import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { ButtonTemplateSliceSchema } from "../button_template/button-template.js";
import { ComponentStyleSchema } from "./component-style.js";
import {
  ButtonImageFrameSchema,
  ButtonPatternLayerSchema,
  StretchVisualDesignSchema,
} from "./stretch-visual-design.js";

export const ButtonBaseDesignSchema = z.object({
  templateId: z.string().min(1),
  sourceDataUrl: z.string().min(1),
  scalingMode: z.enum(["fixedAspect", "nineSlice"]).default("fixedAspect"),
  slice: ButtonTemplateSliceSchema.optional(),
});
export type ButtonBaseDesign = z.infer<typeof ButtonBaseDesignSchema>;

export const ButtonStateContentTypeSchema = z.enum(["text", "pattern"]);
export type ButtonStateContentType = z.infer<typeof ButtonStateContentTypeSchema>;

export const ButtonStateOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  label: z.string().min(1),
  contentType: nullishToUndefined(ButtonStateContentTypeSchema),
  icon: nullishToUndefined(z.string().min(1)),
  baseTemplateId: nullishToUndefined(z.enum(["rounded", "pill", "beveled", "flat", "glass"])),
  patternTemplateId: nullishToUndefined(z.enum(["none", "gift", "check", "lock", "coin", "calendar", "star"])),
  baseDesign: nullishToUndefined(ButtonBaseDesignSchema),
  patternDesign: nullishToUndefined(StretchVisualDesignSchema),
  patternLayers: nullishToUndefined(z.array(ButtonPatternLayerSchema).min(1)),
  style: ComponentStyleSchema,
});
export type ButtonStateOption = z.infer<typeof ButtonStateOptionSchema>;

export const ButtonStateDesignSchema = z.object({
  defaultStateId: z.string().min(1),
  states: z.array(ButtonStateOptionSchema).min(1),
  stateSource: nullishToUndefined(z.object({
    apiKey: z.string().min(1),
    field: z.string().min(1).default("status"),
  })),
});
export type ButtonStateDesign = z.infer<typeof ButtonStateDesignSchema>;

export const ImageCropSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().positive().max(100),
  height: z.number().positive().max(100),
});
export type ImageCrop = z.infer<typeof ImageCropSchema>;

export const ImagePolygonPointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});
export type ImagePolygonPoint = z.infer<typeof ImagePolygonPointSchema>;

export const ButtonImageDesignSchema = z.object({
  sourceDataUrl: z.string().min(1),
  sourceName: nullishToUndefined(z.string().min(1)),
  crop: nullishToUndefined(ImageCropSchema),
  scanArea: nullishToUndefined(ImageCropSchema),
  imageFrame: nullishToUndefined(ButtonImageFrameSchema),
  polygonPoints: nullishToUndefined(z.array(ImagePolygonPointSchema)),
  whiteTolerance: nullishToUndefined(z.number().min(0).max(120)),
  renderWhiteTolerance: nullishToUndefined(z.number().min(-1).max(120)),
  outputDataUrl: nullishToUndefined(z.string().min(1)),
});
export type ButtonImageDesign = z.infer<typeof ButtonImageDesignSchema>;
