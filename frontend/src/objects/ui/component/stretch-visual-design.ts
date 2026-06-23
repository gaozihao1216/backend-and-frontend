import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";

export const ButtonImageFrameSchema = z.object({
  x: z.number().min(-25).max(125),
  y: z.number().min(-25).max(125),
  width: z.number().positive().max(125),
  height: z.number().positive().max(125),
});
export type ButtonImageFrame = z.infer<typeof ButtonImageFrameSchema>;

export const StretchVisualDesignSchema = z.object({
  templateId: z.string().min(1),
  sourceDataUrl: nullishToUndefined(z.string().min(1)),
  frame: nullishToUndefined(ButtonImageFrameSchema),
});
export type StretchVisualDesign = z.infer<typeof StretchVisualDesignSchema>;

export const ButtonPatternLayerKindSchema = z.enum(["pattern", "artText"]);
export type ButtonPatternLayerKind = z.infer<typeof ButtonPatternLayerKindSchema>;

export const ButtonPatternLayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: ButtonPatternLayerKindSchema.default("pattern"),
  design: StretchVisualDesignSchema,
  artTextLabel: nullishToUndefined(z.string().min(1)),
});
export type ButtonPatternLayer = z.infer<typeof ButtonPatternLayerSchema>;

export const PanelDecorationSchema = z.object({
  templateId: z.enum([
    "plain",
    "paper",
    "reward",
    "glass",
    "notice",
    "levelSky",
    "levelGrass",
    "levelParchment",
    "levelTwilight",
    "levelInk",
  ]).default("plain"),
  accentColor: nullishToUndefined(z.string().min(1)),
  backgroundDesign: nullishToUndefined(StretchVisualDesignSchema),
});
export type PanelDecoration = z.infer<typeof PanelDecorationSchema>;
