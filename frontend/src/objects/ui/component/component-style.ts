import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";

export const ComponentStyleSchema = z.object({
  variant: nullishToUndefined(z.enum(["primary", "secondary", "ghost"])),
  backgroundColor: nullishToUndefined(z.string().min(1)),
  textColor: nullishToUndefined(z.string().min(1)),
  borderRadius: nullishToUndefined(z.number().min(0)),
  fontSize: nullishToUndefined(z.number().positive()),
  textScalePercent: nullishToUndefined(z.number().positive().max(100)),
  lockAspectRatio: nullishToUndefined(z.number().positive()),
});
export type ComponentStyle = z.infer<typeof ComponentStyleSchema>;

export const ComponentVisualEffectSchema = z.object({
  templateId: z.enum(["none", "softGlow", "rewardPulse", "slideIn", "sparkle"]).default("none"),
  intensity: nullishToUndefined(z.number().min(0).max(100)),
});
export type ComponentVisualEffect = z.infer<typeof ComponentVisualEffectSchema>;

export const TextArtPresetSchema = z.enum([
  "plain",
  "goldGradient",
  "inkBrush",
  "runningScript",
  "sealCinnabar",
]);
export type TextArtPreset = z.infer<typeof TextArtPresetSchema>;

export const TextArtGradientDirectionSchema = z.enum([
  "toBottom",
  "toTop",
  "toRight",
  "toLeft",
  "diagonal",
]);
export type TextArtGradientDirection = z.infer<typeof TextArtGradientDirectionSchema>;

export const TextArtGradientIntensitySchema = z.enum([
  "soft",
  "normal",
  "strong",
]);
export type TextArtGradientIntensity = z.infer<typeof TextArtGradientIntensitySchema>;

export const TextArtDesignSchema = z.object({
  preset: TextArtPresetSchema.default("goldGradient"),
  accentColor: nullishToUndefined(z.string().min(1)),
  gradientDirection: nullishToUndefined(TextArtGradientDirectionSchema),
  gradientIntensity: nullishToUndefined(TextArtGradientIntensitySchema),
});
export type TextArtDesign = z.infer<typeof TextArtDesignSchema>;
