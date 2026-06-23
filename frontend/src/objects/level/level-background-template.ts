import { z } from "zod";
import { StretchVisualDesignSchema } from "../ui/component/stretch-visual-design.js";

export const LevelBackgroundWeatherSchema = z.enum(["sunny", "rainy", "thunderstorm"]);

export type LevelBackgroundWeather = z.infer<typeof LevelBackgroundWeatherSchema>;

export const LevelBackgroundEffectsSchema = z.object({
  cloudSpeed: z.number().min(0).max(100),
  cloudDensity: z.number().min(0).max(12),
  rainIntensity: z.number().min(0).max(100),
  rainSpeed: z.number().min(1).max(30),
  lightningIntervalMs: z.number().min(800).max(12000),
  lightningFlashOpacity: z.number().min(0.1).max(1),
});

export type LevelBackgroundEffects = z.infer<typeof LevelBackgroundEffectsSchema>;

export const LevelBackgroundTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  weather: LevelBackgroundWeatherSchema,
  skyTopColor: z.string().min(1),
  skyBottomColor: z.string().min(1),
  horizonColor: z.string().min(1),
  accentColor: z.string().min(1),
  panelBackgroundDesign: StretchVisualDesignSchema.optional(),
  cloudPatternDesigns: z.array(StretchVisualDesignSchema).default([]),
  effects: LevelBackgroundEffectsSchema,
  updatedAt: z.string(),
});

export type LevelBackgroundTemplate = z.infer<typeof LevelBackgroundTemplateSchema>;

export const LEVEL_BACKGROUND_WEATHER_META: ReadonlyArray<{
  id: LevelBackgroundWeather;
  label: string;
  description: string;
}> = [
  {
    id: "sunny",
    label: "晴天",
    description: "明亮天空与缓慢漂移的云朵，适合常规关卡。",
  },
  {
    id: "rainy",
    label: "雨天",
    description: "灰蓝天空与下落雨滴，营造湿润氛围。",
  },
  {
    id: "thunderstorm",
    label: "雷雨天",
    description: "暗沉天空、密集雨丝与间歇闪电，适合紧张章节。",
  },
];
