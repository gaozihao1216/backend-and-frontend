import { getPageConfig, savePageConfig } from "./ui-customization.js";
import { loadVisualAsset, saveVisualAsset } from "./ui-visual-asset-store.js";
import type { PageConfig, PanelDecoration, StretchVisualDesign } from "../objects/ui-customization/ui-customization-objects.js";
import { LEVEL_MAP_PAGE_ID } from "../objects/ui-customization/level-map-structure.js";
import type { StretchVisualTemplate } from "../objects/ui-customization/stretch-visual-template.js";

export const LEVEL_STAGE_CUSTOM_STYLE_ID_PREFIX = "levelStageBg-";

export const LEVEL_STAGE_BACKGROUND_PRESET_IDS = [
  "levelSky",
  "levelGrass",
  "levelParchment",
  "levelTwilight",
  "levelInk",
] as const;

export type LevelStageBackgroundPresetId = typeof LEVEL_STAGE_BACKGROUND_PRESET_IDS[number];

export const LEVEL_STAGE_BACKGROUND_PRESETS: ReadonlyArray<{
  id: LevelStageBackgroundPresetId;
  label: string;
  description: string;
  defaultAccent: string;
}> = [
  {
    id: "levelSky",
    label: "天空路径",
    description: "浅蓝天空过渡到草地，适合默认链条地图。",
    defaultAccent: "#6db8ff",
  },
  {
    id: "levelGrass",
    label: "草地原野",
    description: "明亮绿色层次，突出路径节点。",
    defaultAccent: "#7fbf5b",
  },
  {
    id: "levelParchment",
    label: "羊皮卷轴",
    description: "复古纸感地图，偏暖色叙事风格。",
    defaultAccent: "#c9a45c",
  },
  {
    id: "levelTwilight",
    label: "暮色余晖",
    description: "橙紫渐变暮色，适合章节过渡感。",
    defaultAccent: "#ff9a62",
  },
  {
    id: "levelInk",
    label: "水墨山水",
    description: "淡墨渐变，偏东方意境。",
    defaultAccent: "#5f7f93",
  },
];

export const LEVEL_STAGE_BACKGROUND_PAGE_IDS = [
  LEVEL_MAP_PAGE_ID,
  "player.home",
  "designer.home",
  "admin.home",
  "director.home",
] as const;

export const isLevelStageBackgroundPreset = (
  templateId: PanelDecoration["templateId"],
): templateId is LevelStageBackgroundPresetId =>
  LEVEL_STAGE_BACKGROUND_PRESET_IDS.includes(templateId as LevelStageBackgroundPresetId);

export const isLevelStageCustomStyleId = (templateId: string): boolean =>
  templateId.startsWith(LEVEL_STAGE_CUSTOM_STYLE_ID_PREFIX);

export const filterLevelStageCustomStyles = (
  templates: StretchVisualTemplate[],
): StretchVisualTemplate[] =>
  templates.filter((template) => isLevelStageCustomStyleId(template.id));

export const createLevelStageCustomStyleTemplate = (
  name: string,
  sourceDataUrl: string,
): StretchVisualTemplate => ({
  id: `${LEVEL_STAGE_CUSTOM_STYLE_ID_PREFIX}${Date.now().toString(36)}`,
  name: name.trim() || "自定义背景",
  sourceDataUrl,
  kind: "panel",
});

export const createLevelStageDecorationFromTemplate = (
  template: StretchVisualTemplate,
  accentColor?: string,
): PanelDecoration => ({
  templateId: "plain",
  ...(accentColor ? { accentColor } : {}),
  backgroundDesign: {
    templateId: template.id,
    sourceDataUrl: template.sourceDataUrl,
  },
});

export const getLevelStageBackgroundMode = (
  decoration: PanelDecoration | undefined,
): "style" | "image" =>
  decoration?.backgroundDesign ? "image" : "style";

export const getDefaultLevelStageDecoration = (): PanelDecoration => ({
  templateId: "levelSky",
  accentColor: "#6db8ff",
});

export const normalizeLevelStageDecoration = (
  decoration: PanelDecoration | undefined,
): PanelDecoration => {
  if (!decoration) {
    return getDefaultLevelStageDecoration();
  }

  if (decoration.backgroundDesign) {
    return {
      templateId: decoration.templateId ?? "plain",
      ...(decoration.accentColor ? { accentColor: decoration.accentColor } : {}),
      backgroundDesign: decoration.backgroundDesign,
    };
  }

  const preset = isLevelStageBackgroundPreset(decoration.templateId)
    ? decoration.templateId
    : "levelSky";
  const defaultAccent = LEVEL_STAGE_BACKGROUND_PRESETS.find((item) => item.id === preset)?.defaultAccent
    ?? "#6db8ff";

  return {
    templateId: preset,
    accentColor: decoration.accentColor ?? defaultAccent,
  };
};

export const createLevelStageStyleDecoration = (
  presetId: LevelStageBackgroundPresetId,
  accentColor?: string,
): PanelDecoration => {
  const defaultAccent = LEVEL_STAGE_BACKGROUND_PRESETS.find((item) => item.id === presetId)?.defaultAccent
    ?? "#6db8ff";

  return {
    templateId: presetId,
    accentColor: accentColor ?? defaultAccent,
  };
};

export const createLevelStageImageDecoration = (
  sourceDataUrl: string,
  templateId: string,
  accentColor?: string,
): PanelDecoration => ({
  templateId: "plain",
  ...(accentColor ? { accentColor } : {}),
  backgroundDesign: {
    templateId,
    sourceDataUrl,
  },
});

const stripBackgroundDesignForStorage = (
  backgroundDesign: StretchVisualDesign,
): StretchVisualDesign => ({
  templateId: backgroundDesign.templateId,
  ...(backgroundDesign.frame ? { frame: backgroundDesign.frame } : {}),
});

export const prepareLevelStageDecorationForStorage = async (
  decoration: PanelDecoration,
): Promise<PanelDecoration> => {
  if (!decoration.backgroundDesign?.sourceDataUrl) {
    return decoration;
  }

  await saveVisualAsset(
    decoration.backgroundDesign.templateId,
    decoration.backgroundDesign.sourceDataUrl,
  );

  return {
    ...decoration,
    backgroundDesign: stripBackgroundDesignForStorage(decoration.backgroundDesign),
  };
};

export const hydrateLevelStageDecoration = async (
  decoration: PanelDecoration,
): Promise<PanelDecoration> => {
  if (!decoration.backgroundDesign || decoration.backgroundDesign.sourceDataUrl) {
    return decoration;
  }

  const sourceDataUrl = await loadVisualAsset(decoration.backgroundDesign.templateId);
  if (!sourceDataUrl) {
    return decoration;
  }

  return {
    ...decoration,
    backgroundDesign: {
      ...decoration.backgroundDesign,
      sourceDataUrl,
    },
  };
};

export const getStagePanelDecoration = (pageConfig: PageConfig): PanelDecoration | undefined => {
  const stagePanel = pageConfig.components.find(
    (component) => component.type === "panel" && component.kind === "stage",
  );

  return stagePanel?.type === "panel" ? stagePanel.decoration : undefined;
};

export const applyLevelStageDecoration = (
  pageConfig: PageConfig,
  decoration: PanelDecoration,
): PageConfig => ({
  ...pageConfig,
  components: pageConfig.components.map((component) =>
    component.type === "panel" && component.kind === "stage"
      ? {
          ...component,
          decoration,
          style: {
            ...(component.style ?? {}),
            backgroundColor: "transparent",
            borderRadius: component.style?.borderRadius ?? 14,
          },
        }
      : component,
  ),
});

export const syncLevelStageBackground = async (decoration: PanelDecoration): Promise<PageConfig[]> => {
  const storageDecoration = await prepareLevelStageDecorationForStorage(decoration);
  const savedConfigs: PageConfig[] = [];

  for (const pageId of LEVEL_STAGE_BACKGROUND_PAGE_IDS) {
    const pageConfig = getPageConfig(pageId);
    if (!pageConfig) {
      continue;
    }

    savedConfigs.push(savePageConfig(applyLevelStageDecoration(pageConfig, storageDecoration)));
  }

  return savedConfigs;
};

export const getLevelStageDecorationFromStore = async (): Promise<PanelDecoration> => {
  const pageConfig = getPageConfig(LEVEL_MAP_PAGE_ID);
  if (!pageConfig) {
    return getDefaultLevelStageDecoration();
  }

  return hydrateLevelStageDecoration(
    normalizeLevelStageDecoration(getStagePanelDecoration(pageConfig)),
  );
};
