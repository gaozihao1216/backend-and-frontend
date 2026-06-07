import { getPageConfig, savePageConfig } from "./ui-customization.js";
import {
  LEVEL_MAP_PAGE_ID,
  LEVEL_NODE_DEFINITIONS,
  getLevelScreenPageId,
} from "../objects/ui-customization/level-map-structure.js";
import { LEVEL_STAGE_BACKGROUND_PAGE_IDS } from "./level-stage-background.js";
import {
  getButtonStateContentType,
  normalizeButtonStatePatternLayerDrafts,
  serializePatternLayersForStateOption,
  type ButtonPatternLayerDraft,
} from "./button-pattern-layers.js";
import {
  formatTemplateSelectValue,
  getButtonBaseTemplateSelectValue,
  getPatternTemplateSelectValue,
} from "./director-template-select.js";
import type {
  ButtonBaseDesign,
  ButtonComponent,
  ButtonStateDesign,
  ButtonStateOption,
  ComponentStyle,
  PageConfig,
  PageComponent,
  StretchVisualDesign,
} from "../objects/ui-customization/ui-customization-objects.js";

export const LEVEL_NODE_PROGRESS_API_KEY = "player.levelProgress";

export const LEVEL_NODE_BUTTON_MAX_FONT_SIZE = 14;

export const LEVEL_NODE_PROGRESS_STATE_IDS = ["locked", "notCleared", "cleared"] as const;

export type LevelNodeProgressStateId = typeof LEVEL_NODE_PROGRESS_STATE_IDS[number];

export type LevelNodeSharedButtonDesign = {
  baseTemplateValue: string;
  baseDesign?: ButtonBaseDesign;
  contentType: "text" | "pattern";
  patternTemplateValue: string;
  patternDesign?: StretchVisualDesign;
  patternLayers: ButtonPatternLayerDraft[];
  variant: NonNullable<ComponentStyle["variant"]>;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontSize: number;
  textScalePercent: number;
};

export type LevelNodeButtonLabelMode = "stateOnly" | "levelAndState" | "levelNumberAndState";

export type LevelNodeButtonFormatSettings = {
  sharedDesign: LevelNodeSharedButtonDesign;
  stateLabels: Record<LevelNodeProgressStateId, string>;
  stateIcons: Record<LevelNodeProgressStateId, string>;
  defaultStateId: LevelNodeProgressStateId;
  labelMode: LevelNodeButtonLabelMode;
};

export const LEVEL_NODE_PROGRESS_STATE_META: ReadonlyArray<{
  id: LevelNodeProgressStateId;
  name: string;
  description: string;
}> = [
  { id: "locked", name: "未解锁", description: "前置关卡未完成，按钮不可进入。" },
  { id: "notCleared", name: "未通关", description: "已解锁但尚未通关，可进入挑战。" },
  { id: "cleared", name: "已通关", description: "玩家已成功通关该关卡。" },
];

export const getDefaultLevelNodeSharedButtonDesign = (): LevelNodeSharedButtonDesign => ({
  baseTemplateValue: "",
  contentType: "text",
  patternTemplateValue: "",
  patternLayers: [],
  variant: "primary",
  backgroundColor: "#12202f",
  textColor: "#fff8ef",
  borderRadius: 999,
  fontSize: 11,
  textScalePercent: 42,
});

export const getDefaultLevelNodeButtonFormatSettings = (): LevelNodeButtonFormatSettings => ({
  sharedDesign: getDefaultLevelNodeSharedButtonDesign(),
  stateLabels: {
    locked: "未解锁",
    notCleared: "未通关",
    cleared: "已通关",
  },
  stateIcons: {
    locked: "lock",
    notCleared: "circle",
    cleared: "check",
  },
  defaultStateId: "locked",
  labelMode: "levelAndState",
});

export const getLevelSuffixFromNodeButton = (button: ButtonComponent): string | null => {
  if (button.action.type !== "navigate") {
    return null;
  }

  const level = LEVEL_NODE_DEFINITIONS.find(
    (candidate) => button.action.type === "navigate"
      && button.action.targetPageId === getLevelScreenPageId(candidate.suffix),
  );

  return level?.suffix ?? null;
};

export const isLevelNodeButtonComponent = (component: PageComponent): component is ButtonComponent =>
  component.type === "button" && getLevelSuffixFromNodeButton(component) != null;

const findLevelNodeButton = (
  pageConfig: PageConfig,
  levelSuffix?: string,
): ButtonComponent | null => {
  const candidates = pageConfig.components.filter(isLevelNodeButtonComponent);
  if (candidates.length === 0) {
    return null;
  }

  if (levelSuffix) {
    return candidates.find((button) => getLevelSuffixFromNodeButton(button) === levelSuffix) ?? null;
  }

  return candidates.find((button) => button.stateDesign) ?? candidates[0] ?? null;
};

const getLevelNodeNumber = (levelSuffix: string, levelLabel: string): string => {
  const suffixMatch = levelSuffix.match(/(\d+)/);
  if (suffixMatch?.[1]) {
    return suffixMatch[1].padStart(2, "0");
  }

  const labelMatch = levelLabel.match(/^(\d+)/);
  if (labelMatch?.[1]) {
    return labelMatch[1];
  }

  return levelSuffix;
};

const detectLabelMode = (sampleLabel: string): LevelNodeButtonLabelMode => {
  if (!sampleLabel.includes(" · ")) {
    return "stateOnly";
  }

  const prefix = sampleLabel.split(" · ")[0]?.trim() ?? "";
  return /^\d+$/.test(prefix) ? "levelNumberAndState" : "levelAndState";
};

export const formatLevelNodeButtonLabel = (
  levelSuffix: string,
  levelLabel: string,
  stateId: LevelNodeProgressStateId,
  settings: LevelNodeButtonFormatSettings,
): string => {
  const stateLabel = settings.stateLabels[stateId];

  switch (settings.labelMode) {
    case "levelAndState":
      return `${levelLabel} · ${stateLabel}`;
    case "levelNumberAndState":
      return `${getLevelNodeNumber(levelSuffix, levelLabel)} · ${stateLabel}`;
    case "stateOnly":
    default:
      return stateLabel;
  }
};

const buildStateLabel = (
  levelSuffix: string,
  levelLabel: string,
  stateId: LevelNodeProgressStateId,
  settings: LevelNodeButtonFormatSettings,
): string => formatLevelNodeButtonLabel(levelSuffix, levelLabel, stateId, settings);

const buildSharedComponentStyle = (design: LevelNodeSharedButtonDesign): ComponentStyle => ({
  variant: design.variant,
  backgroundColor: design.backgroundColor,
  textColor: design.textColor,
  borderRadius: design.borderRadius,
  fontSize: Math.min(LEVEL_NODE_BUTTON_MAX_FONT_SIZE, design.fontSize),
});

const buildSharedStateOption = (
  stateId: LevelNodeProgressStateId,
  levelSuffix: string,
  levelLabel: string,
  settings: LevelNodeButtonFormatSettings,
): ButtonStateOption => {
  const design = settings.sharedDesign;
  const contentType = getButtonStateContentType(design);
  const serializedLayers = serializePatternLayersForStateOption(normalizeButtonStatePatternLayerDrafts(design));
  const icon = settings.stateIcons[stateId].trim();

  return {
    id: stateId,
    name: LEVEL_NODE_PROGRESS_STATE_META.find((item) => item.id === stateId)?.name ?? stateId,
    label: buildStateLabel(levelSuffix, levelLabel, stateId, settings),
    contentType,
    ...(icon && contentType === "text" ? { icon } : {}),
    ...(design.baseDesign ? { baseDesign: design.baseDesign } : {}),
    ...(contentType === "pattern" && serializedLayers
      ? {
          patternLayers: serializedLayers,
          patternDesign: serializedLayers[0]?.design,
        }
      : {}),
    style: buildSharedComponentStyle(design),
  };
};

export const createLevelNodeButtonStateDesign = (
  levelSuffix: string,
  levelLabel: string,
  settings: LevelNodeButtonFormatSettings,
): ButtonStateDesign => ({
  defaultStateId: settings.defaultStateId,
  stateSource: {
    apiKey: LEVEL_NODE_PROGRESS_API_KEY,
    field: `levels.${levelSuffix}`,
  },
  states: LEVEL_NODE_PROGRESS_STATE_IDS.map((stateId) =>
    buildSharedStateOption(stateId, levelSuffix, levelLabel, settings),
  ),
});

const createLevelNodeButtonPatch = (
  component: ButtonComponent,
  settings: LevelNodeButtonFormatSettings,
): ButtonComponent => {
  const levelSuffix = getLevelSuffixFromNodeButton(component);
  if (!levelSuffix) {
    return component;
  }

  const level = LEVEL_NODE_DEFINITIONS.find((candidate) => candidate.suffix === levelSuffix);
  if (!level) {
    return component;
  }

  const sharedStyle = buildSharedComponentStyle(settings.sharedDesign);

  return {
    ...component,
    label: level.label,
    icon: settings.stateIcons.notCleared,
    ...(settings.sharedDesign.baseDesign ? { baseDesign: settings.sharedDesign.baseDesign } : {}),
    style: sharedStyle,
    stateDesign: createLevelNodeButtonStateDesign(level.suffix, level.label, settings),
  };
};

export const applyLevelNodeButtonFormat = (
  pageConfig: PageConfig,
  settings: LevelNodeButtonFormatSettings,
): PageConfig => ({
  ...pageConfig,
  components: pageConfig.components.map((component) =>
    isLevelNodeButtonComponent(component)
      ? createLevelNodeButtonPatch(component, settings)
      : component,
  ),
});

export const syncLevelNodeButtonFormat = (settings: LevelNodeButtonFormatSettings): PageConfig[] => {
  const savedConfigs: PageConfig[] = [];

  LEVEL_STAGE_BACKGROUND_PAGE_IDS.forEach((pageId) => {
    const pageConfig = getPageConfig(pageId);
    if (!pageConfig) {
      return;
    }

    savedConfigs.push(savePageConfig(applyLevelNodeButtonFormat(pageConfig, settings)));
  });

  return savedConfigs;
};

const extractSharedDesignFromButton = (button: ButtonComponent): LevelNodeSharedButtonDesign => {
  const defaults = getDefaultLevelNodeSharedButtonDesign();
  const sampleState = button.stateDesign?.states[0];
  const patternLayers = sampleState
    ? normalizeButtonStatePatternLayerDrafts(sampleState)
    : defaults.patternLayers;
  const patternTemplateValue = sampleState && "patternDesign" in sampleState && sampleState.patternDesign
    ? formatTemplateSelectValue("library", sampleState.patternDesign.templateId)
    : defaults.patternTemplateValue;

  return {
    baseTemplateValue: button.baseDesign
      ? formatTemplateSelectValue("library", button.baseDesign.templateId)
      : sampleState?.baseDesign
        ? formatTemplateSelectValue("library", sampleState.baseDesign.templateId)
        : defaults.baseTemplateValue,
    ...(button.baseDesign ?? sampleState?.baseDesign
      ? { baseDesign: button.baseDesign ?? sampleState?.baseDesign }
      : {}),
    contentType: sampleState?.contentType ?? defaults.contentType,
    patternTemplateValue,
    ...(sampleState?.patternDesign ? { patternDesign: sampleState.patternDesign } : {}),
    patternLayers,
    variant: button.style?.variant ?? sampleState?.style?.variant ?? defaults.variant,
    backgroundColor: button.style?.backgroundColor ?? sampleState?.style?.backgroundColor ?? defaults.backgroundColor,
    textColor: button.style?.textColor ?? sampleState?.style?.textColor ?? defaults.textColor,
    borderRadius: button.style?.borderRadius ?? sampleState?.style?.borderRadius ?? defaults.borderRadius,
    fontSize: Math.min(
      LEVEL_NODE_BUTTON_MAX_FONT_SIZE,
      button.style?.fontSize ?? sampleState?.style?.fontSize ?? defaults.fontSize,
    ),
    textScalePercent: defaults.textScalePercent,
  };
};

const clampLevelNodeButtonStyle = (style?: ComponentStyle): ComponentStyle | undefined => {
  if (!style) {
    return style;
  }

  const { textScalePercent: _removed, ...rest } = style;
  const fontSize = typeof rest.fontSize === "number"
    ? Math.min(LEVEL_NODE_BUTTON_MAX_FONT_SIZE, rest.fontSize)
    : rest.fontSize;

  return {
    ...rest,
    ...(typeof fontSize === "number" ? { fontSize } : {}),
  };
};

export const sanitizeLevelNodeButtonComponent = (component: PageComponent): PageComponent => {
  if (!isLevelNodeButtonComponent(component)) {
    return component;
  }

  const nextStyle = clampLevelNodeButtonStyle(component.style);
  const nextStateDesign = component.stateDesign
    ? {
        ...component.stateDesign,
        states: component.stateDesign.states.map((state: ButtonStateOption) => ({
          ...state,
          style: clampLevelNodeButtonStyle(state.style),
        })),
      }
    : component.stateDesign;

  return {
    ...component,
    ...(nextStyle ? { style: nextStyle } : {}),
    ...(nextStateDesign ? { stateDesign: nextStateDesign } : {}),
  };
};

export const sanitizePageConfigLevelNodeButtons = (pageConfig: PageConfig): PageConfig => ({
  ...pageConfig,
  components: pageConfig.components.map(sanitizeLevelNodeButtonComponent),
});

const extractSettingsFromButton = (button: ButtonComponent): LevelNodeButtonFormatSettings => {
  const defaults = getDefaultLevelNodeButtonFormatSettings();
  const stateDesign = button.stateDesign;
  if (!stateDesign) {
    return {
      ...defaults,
      sharedDesign: extractSharedDesignFromButton(button),
    };
  }

  const stateLabels = { ...defaults.stateLabels };
  const stateIcons = { ...defaults.stateIcons };

  stateDesign.states.forEach((state: ButtonStateOption) => {
    if (LEVEL_NODE_PROGRESS_STATE_IDS.includes(state.id as LevelNodeProgressStateId)) {
      const stateId = state.id as LevelNodeProgressStateId;
      stateLabels[stateId] = state.label.includes(" · ")
        ? state.label.split(" · ").slice(-1)[0] ?? state.label
        : state.label;
      if (state.icon) {
        stateIcons[stateId] = state.icon;
      }
    }
  });

  const sampleState = stateDesign.states.find((state: ButtonStateOption) => state.id === "notCleared")
    ?? stateDesign.states[0];
  const labelMode = sampleState ? detectLabelMode(sampleState.label) : "stateOnly";

  return {
    sharedDesign: extractSharedDesignFromButton(button),
    stateLabels,
    stateIcons,
    defaultStateId: LEVEL_NODE_PROGRESS_STATE_IDS.includes(stateDesign.defaultStateId as LevelNodeProgressStateId)
      ? stateDesign.defaultStateId as LevelNodeProgressStateId
      : defaults.defaultStateId,
    labelMode,
  };
};

export const getLevelNodeButtonFormatFromStore = (): LevelNodeButtonFormatSettings => {
  const pageConfig = getPageConfig(LEVEL_MAP_PAGE_ID);
  const firstLevel = LEVEL_NODE_DEFINITIONS[0];
  if (!pageConfig || !firstLevel) {
    return getDefaultLevelNodeButtonFormatSettings();
  }

  const button = findLevelNodeButton(pageConfig, firstLevel.suffix);

  if (!button) {
    return getDefaultLevelNodeButtonFormatSettings();
  }

  return extractSettingsFromButton(button);
};

export const createPreviewLevelProgressUiData = (
  previewState: LevelNodeProgressStateId,
  previewLevelSuffix = LEVEL_NODE_DEFINITIONS[0]?.suffix ?? "level01",
): Record<string, unknown> => {
  const previewIndex = LEVEL_NODE_DEFINITIONS.findIndex((level) => level.suffix === previewLevelSuffix);
  const levels = Object.fromEntries(
    LEVEL_NODE_DEFINITIONS.map((level, index) => {
      if (level.suffix === previewLevelSuffix) {
        return [level.suffix, previewState];
      }

      if (index < previewIndex) {
        return [level.suffix, "cleared"];
      }

      return [level.suffix, "locked"];
    }),
  );

  return {
    [LEVEL_NODE_PROGRESS_API_KEY]: { levels },
  };
};

export const getSharedDesignTemplateSelectValues = (design: LevelNodeSharedButtonDesign) => ({
  baseTemplateValue: getButtonBaseTemplateSelectValue({
    ...(design.baseTemplateValue ? { baseTemplateValue: design.baseTemplateValue } : {}),
    ...(design.baseDesign ? { baseDesign: design.baseDesign } : {}),
  }),
  patternTemplateValue: getPatternTemplateSelectValue({
    ...(design.patternTemplateValue ? { patternTemplateValue: design.patternTemplateValue } : {}),
    ...(design.patternDesign ? { patternDesign: design.patternDesign } : {}),
  }),
});
