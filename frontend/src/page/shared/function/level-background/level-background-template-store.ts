import {
  LevelBackgroundTemplateSchema,
  type LevelBackgroundTemplate,
  type LevelBackgroundWeather,
} from "../../../../objects/level/level-background-template.js";
import type { StretchVisualDesign } from "../../../../objects/ui-customization/ui-customization-objects.js";
import { loadVisualAsset, saveVisualAsset } from "../ui-config/ui-visual-asset-store.js";

const STORAGE_KEY = "ugc-level-background-templates";

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const stripStretchVisualDesignForStorage = (
  design: StretchVisualDesign,
): StretchVisualDesign => ({
  templateId: design.templateId,
  ...(design.frame ? { frame: design.frame } : {}),
});

export const compactLevelBackgroundTemplateForStorage = (
  template: LevelBackgroundTemplate,
): LevelBackgroundTemplate => ({
  ...template,
  panelBackgroundDesign: template.panelBackgroundDesign
    ? stripStretchVisualDesignForStorage(template.panelBackgroundDesign)
    : undefined,
  cloudPatternDesigns: template.cloudPatternDesigns.map(stripStretchVisualDesignForStorage),
});

const persistStretchVisualDesignAssets = async (design: StretchVisualDesign): Promise<void> => {
  if (!design.sourceDataUrl) {
    return;
  }

  await saveVisualAsset(design.templateId, design.sourceDataUrl);
};

export const prepareLevelBackgroundTemplateForStorage = async (
  template: LevelBackgroundTemplate,
): Promise<LevelBackgroundTemplate> => {
  if (template.panelBackgroundDesign) {
    await persistStretchVisualDesignAssets(template.panelBackgroundDesign);
  }

  for (const design of template.cloudPatternDesigns) {
    await persistStretchVisualDesignAssets(design);
  }

  return compactLevelBackgroundTemplateForStorage({
    ...template,
    updatedAt: new Date().toISOString(),
  });
};

const writeTemplatesToStorage = (templates: LevelBackgroundTemplate[]): LevelBackgroundTemplate[] => {
  const validated = templates.map((template) =>
    LevelBackgroundTemplateSchema.parse(compactLevelBackgroundTemplateForStorage(template)),
  );

  if (!canUseStorage()) {
    return validated;
  }

  const payload = JSON.stringify(validated);

  try {
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("quota") || message.includes("QuotaExceededError")) {
      throw new Error("本地存储空间不足。已改为仅保存模板引用，请重试；若仍失败，请减少模板数量或清理浏览器站点数据。");
    }
    throw error;
  }

  return validated;
};

const createDefaultEffects = (weather: LevelBackgroundWeather): LevelBackgroundTemplate["effects"] => {
  if (weather === "sunny") {
    return {
      cloudSpeed: 42,
      cloudDensity: 5,
      rainIntensity: 0,
      rainSpeed: 10,
      lightningIntervalMs: 4000,
      lightningFlashOpacity: 0.7,
    };
  }

  if (weather === "rainy") {
    return {
      cloudSpeed: 18,
      cloudDensity: 6,
      rainIntensity: 58,
      rainSpeed: 14,
      lightningIntervalMs: 5000,
      lightningFlashOpacity: 0.7,
    };
  }

  return {
    cloudSpeed: 24,
    cloudDensity: 7,
    rainIntensity: 82,
    rainSpeed: 18,
    lightningIntervalMs: 2600,
    lightningFlashOpacity: 0.88,
  };
};

const createDefaultTemplate = (
  id: string,
  name: string,
  weather: LevelBackgroundWeather,
  skyTopColor: string,
  skyBottomColor: string,
  horizonColor: string,
  accentColor: string,
): LevelBackgroundTemplate => ({
  id,
  name,
  weather,
  skyTopColor,
  skyBottomColor,
  horizonColor,
  accentColor,
  effects: createDefaultEffects(weather),
  cloudPatternDesigns: [],
  updatedAt: new Date().toISOString(),
});

export const DEFAULT_LEVEL_BACKGROUND_TEMPLATES: LevelBackgroundTemplate[] = [
  createDefaultTemplate(
    "level-bg-sunny",
    "晴天模板",
    "sunny",
    "#7ec8ff",
    "#dff4ff",
    "#b8e986",
    "#ffffff",
  ),
  createDefaultTemplate(
    "level-bg-rainy",
    "雨天模板",
    "rainy",
    "#6f8498",
    "#9aa8b8",
    "#5f6d78",
    "#d7e4ef",
  ),
  createDefaultTemplate(
    "level-bg-thunderstorm",
    "雷雨天模板",
    "thunderstorm",
    "#2f3d52",
    "#566579",
    "#3a4658",
    "#eef4ff",
  ),
];

const parseTemplates = (raw: string | null): LevelBackgroundTemplate[] => {
  if (!raw) {
    return DEFAULT_LEVEL_BACKGROUND_TEMPLATES;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_LEVEL_BACKGROUND_TEMPLATES;
    }

    const templates = parsed.map((entry) =>
      LevelBackgroundTemplateSchema.parse(compactLevelBackgroundTemplateForStorage(entry as LevelBackgroundTemplate)),
    );

    if (canUseStorage() && raw.includes("sourceDataUrl")) {
      try {
        writeTemplatesToStorage(templates);
      } catch {
        // Best-effort migration from bloated legacy payloads.
      }
    }

    return templates;
  } catch {
    return DEFAULT_LEVEL_BACKGROUND_TEMPLATES;
  }
};

export const listLevelBackgroundTemplates = (): LevelBackgroundTemplate[] => {
  if (!canUseStorage()) {
    return DEFAULT_LEVEL_BACKGROUND_TEMPLATES;
  }

  return parseTemplates(window.localStorage.getItem(STORAGE_KEY));
};

export const saveLevelBackgroundTemplates = (templates: LevelBackgroundTemplate[]): LevelBackgroundTemplate[] =>
  writeTemplatesToStorage(templates);

export const getLevelBackgroundTemplate = (templateId: string): LevelBackgroundTemplate | null =>
  listLevelBackgroundTemplates().find((template) => template.id === templateId) ?? null;

export const upsertLevelBackgroundTemplate = async (
  template: LevelBackgroundTemplate,
): Promise<LevelBackgroundTemplate[]> => {
  const nextTemplate = await prepareLevelBackgroundTemplateForStorage(template);
  const templates = listLevelBackgroundTemplates();
  const index = templates.findIndex((entry) => entry.id === nextTemplate.id);

  if (index === -1) {
    return writeTemplatesToStorage([...templates, nextTemplate]);
  }

  const nextTemplates = [...templates];
  nextTemplates[index] = nextTemplate;
  return writeTemplatesToStorage(nextTemplates);
};

export const deleteLevelBackgroundTemplate = (templateId: string): LevelBackgroundTemplate[] => {
  const templates = listLevelBackgroundTemplates().filter((template) => template.id !== templateId);
  return saveLevelBackgroundTemplates(templates.length > 0 ? templates : DEFAULT_LEVEL_BACKGROUND_TEMPLATES);
};

export const createLevelBackgroundTemplateDraft = (
  weather: LevelBackgroundWeather,
): LevelBackgroundTemplate => {
  const base = DEFAULT_LEVEL_BACKGROUND_TEMPLATES.find((template) => template.weather === weather)
    ?? DEFAULT_LEVEL_BACKGROUND_TEMPLATES[0]!;

  return {
    ...base,
    id: `level-bg-${weather}-${Date.now().toString(36)}`,
    name: `${LEVEL_BACKGROUND_WEATHER_LABEL[weather]} ${listLevelBackgroundTemplates().length + 1}`,
    updatedAt: new Date().toISOString(),
  };
};

const LEVEL_BACKGROUND_WEATHER_LABEL: Record<LevelBackgroundWeather, string> = {
  sunny: "晴天",
  rainy: "雨天",
  thunderstorm: "雷雨天",
};

export const resetLevelBackgroundTemplates = (): LevelBackgroundTemplate[] =>
  saveLevelBackgroundTemplates(DEFAULT_LEVEL_BACKGROUND_TEMPLATES);

export const hydrateLevelBackgroundTemplate = async (
  template: LevelBackgroundTemplate,
): Promise<LevelBackgroundTemplate> => {
  let panelBackgroundDesign = template.panelBackgroundDesign;
  if (panelBackgroundDesign && !panelBackgroundDesign.sourceDataUrl) {
    const sourceDataUrl = await loadVisualAsset(panelBackgroundDesign.templateId);
    if (sourceDataUrl) {
      panelBackgroundDesign = { ...panelBackgroundDesign, sourceDataUrl };
    }
  }

  const cloudPatternDesigns = await Promise.all(
    template.cloudPatternDesigns.map(async (design) => {
      if (design.sourceDataUrl) {
        return design;
      }

      const sourceDataUrl = await loadVisualAsset(design.templateId);
      return sourceDataUrl ? { ...design, sourceDataUrl } : design;
    }),
  );

  return {
    ...template,
    ...(panelBackgroundDesign ? { panelBackgroundDesign } : {}),
    cloudPatternDesigns,
  };
};
