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
import {
  LEVEL_NODE_PROGRESS_API_KEY,
  LEVEL_NODE_PROGRESS_STATE_IDS,
  createPreviewLevelProgressUiData,
  type LevelNodeProgressStateId,
} from "./level-node-progress.js";
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

export {
  LEVEL_NODE_PROGRESS_API_KEY,
  LEVEL_NODE_PROGRESS_STATE_IDS,
  createPreviewLevelProgressUiData,
  resolveLevelNodeStateFromUiData,
  resolveLevelNodeProgressState,
  type LevelNodeProgressStateId,
} from "./level-node-progress.js";

export const LEVEL_NODE_BUTTON_MAX_FONT_SIZE = 14;

export type LevelNodeStateButtonDesign = {
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

/** @deprecated Use LevelNodeStateButtonDesign */
export type LevelNodeSharedButtonDesign = LevelNodeStateButtonDesign;

export type LevelNodeButtonLabelMode = "stateOnly" | "levelAndState" | "levelNumberAndState";

export type LevelNodeButtonFormatSettings = {
  stateDesigns: Record<LevelNodeProgressStateId, LevelNodeStateButtonDesign>;
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

export const getDefaultLevelNodeStateButtonDesign = (): LevelNodeStateButtonDesign => ({
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

export const getDefaultLevelNodeSharedButtonDesign = getDefaultLevelNodeStateButtonDesign;

const createDefaultStateDesigns = (): Record<LevelNodeProgressStateId, LevelNodeStateButtonDesign> => ({
  locked: {
    ...getDefaultLevelNodeStateButtonDesign(),
    variant: "ghost",
    backgroundColor: "#4a5568",
    textColor: "#e2e8f0",
  },
  notCleared: getDefaultLevelNodeStateButtonDesign(),
  cleared: {
    ...getDefaultLevelNodeStateButtonDesign(),
    variant: "secondary",
    backgroundColor: "#1f6b45",
    textColor: "#f0fff4",
  },
});

export const getDefaultLevelNodeButtonFormatSettings = (): LevelNodeButtonFormatSettings => ({
  stateDesigns: createDefaultStateDesigns(),
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

const buildComponentStyle = (design: LevelNodeStateButtonDesign): ComponentStyle => ({
  variant: design.variant,
  backgroundColor: design.backgroundColor,
  textColor: design.textColor,
  borderRadius: design.borderRadius,
  fontSize: Math.min(LEVEL_NODE_BUTTON_MAX_FONT_SIZE, design.fontSize),
});

const buildStateOption = (
  stateId: LevelNodeProgressStateId,
  levelSuffix: string,
  levelLabel: string,
  settings: LevelNodeButtonFormatSettings,
): ButtonStateOption => {
  const design = settings.stateDesigns[stateId];
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
    style: buildComponentStyle(design),
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
    buildStateOption(stateId, levelSuffix, levelLabel, settings),
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

  const shellDesign = settings.stateDesigns.notCleared;

  return {
    ...component,
    label: level.label,
    icon: settings.stateIcons.notCleared,
    ...(shellDesign.baseDesign ? { baseDesign: shellDesign.baseDesign } : {}),
    style: buildComponentStyle(shellDesign),
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

const extractStateDesignFromStateOption = (
  state: ButtonStateOption | undefined,
  defaults: LevelNodeStateButtonDesign,
): LevelNodeStateButtonDesign => {
  if (!state) {
    return defaults;
  }

  const patternLayers = normalizeButtonStatePatternLayerDrafts(state);
  const patternTemplateValue = state.patternDesign
    ? formatTemplateSelectValue("library", state.patternDesign.templateId)
    : defaults.patternTemplateValue;

  return {
    baseTemplateValue: state.baseDesign
      ? formatTemplateSelectValue("library", state.baseDesign.templateId)
      : defaults.baseTemplateValue,
    ...(state.baseDesign ? { baseDesign: state.baseDesign } : {}),
    contentType: state.contentType ?? getButtonStateContentType(state),
    patternTemplateValue,
    ...(state.patternDesign ? { patternDesign: state.patternDesign } : {}),
    patternLayers,
    variant: state.style?.variant ?? defaults.variant,
    backgroundColor: state.style?.backgroundColor ?? defaults.backgroundColor,
    textColor: state.style?.textColor ?? defaults.textColor,
    borderRadius: state.style?.borderRadius ?? defaults.borderRadius,
    fontSize: Math.min(
      LEVEL_NODE_BUTTON_MAX_FONT_SIZE,
      state.style?.fontSize ?? defaults.fontSize,
    ),
    textScalePercent: defaults.textScalePercent,
  };
};

const extractStateDesignFromButton = (
  button: ButtonComponent,
  stateId?: LevelNodeProgressStateId,
): LevelNodeStateButtonDesign => {
  const defaults = getDefaultLevelNodeStateButtonDesign();
  const stateOption = stateId
    ? button.stateDesign?.states.find((state: ButtonStateOption) => state.id === stateId)
    : button.stateDesign?.states[0];

  if (stateOption) {
    return extractStateDesignFromStateOption(stateOption, defaults);
  }

  return {
    ...defaults,
    ...(button.baseDesign ? {
      baseDesign: button.baseDesign,
      baseTemplateValue: formatTemplateSelectValue("library", button.baseDesign.templateId),
    } : {}),
    variant: button.style?.variant ?? defaults.variant,
    backgroundColor: button.style?.backgroundColor ?? defaults.backgroundColor,
    textColor: button.style?.textColor ?? defaults.textColor,
    borderRadius: button.style?.borderRadius ?? defaults.borderRadius,
    fontSize: Math.min(
      LEVEL_NODE_BUTTON_MAX_FONT_SIZE,
      button.style?.fontSize ?? defaults.fontSize,
    ),
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
    const legacyDesign = extractStateDesignFromButton(button);
    return {
      ...defaults,
      stateDesigns: {
        locked: legacyDesign,
        notCleared: legacyDesign,
        cleared: legacyDesign,
      },
    };
  }

  const stateLabels = { ...defaults.stateLabels };
  const stateIcons = { ...defaults.stateIcons };
  const stateDesigns = { ...defaults.stateDesigns };

  stateDesign.states.forEach((state: ButtonStateOption) => {
    if (LEVEL_NODE_PROGRESS_STATE_IDS.includes(state.id as LevelNodeProgressStateId)) {
      const stateId = state.id as LevelNodeProgressStateId;
      stateLabels[stateId] = state.label.includes(" · ")
        ? state.label.split(" · ").slice(-1)[0] ?? state.label
        : state.label;
      if (state.icon) {
        stateIcons[stateId] = state.icon;
      }
      stateDesigns[stateId] = extractStateDesignFromStateOption(state, defaults.stateDesigns[stateId]);
    }
  });

  const sampleState = stateDesign.states.find((state: ButtonStateOption) => state.id === "notCleared")
    ?? stateDesign.states[0];
  const labelMode = sampleState ? detectLabelMode(sampleState.label) : "stateOnly";

  return {
    stateDesigns,
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

export const getStateDesignTemplateSelectValues = (design: LevelNodeStateButtonDesign) => ({
  baseTemplateValue: getButtonBaseTemplateSelectValue({
    ...(design.baseTemplateValue ? { baseTemplateValue: design.baseTemplateValue } : {}),
    ...(design.baseDesign ? { baseDesign: design.baseDesign } : {}),
  }),
  patternTemplateValue: getPatternTemplateSelectValue({
    ...(design.patternTemplateValue ? { patternTemplateValue: design.patternTemplateValue } : {}),
    ...(design.patternDesign ? { patternDesign: design.patternDesign } : {}),
  }),
});

/** @deprecated Use getStateDesignTemplateSelectValues */
export const getSharedDesignTemplateSelectValues = getStateDesignTemplateSelectValues;

export const updateLevelNodeStateDesign = (
  settings: LevelNodeButtonFormatSettings,
  stateId: LevelNodeProgressStateId,
  patch: Partial<LevelNodeStateButtonDesign>,
): LevelNodeButtonFormatSettings => ({
  ...settings,
  stateDesigns: {
    ...settings.stateDesigns,
    [stateId]: {
      ...settings.stateDesigns[stateId],
      ...patch,
    },
  },
});

export const copyLevelNodeStateDesign = (
  settings: LevelNodeButtonFormatSettings,
  fromStateId: LevelNodeProgressStateId,
  toStateId: LevelNodeProgressStateId,
): LevelNodeButtonFormatSettings => ({
  ...settings,
  stateDesigns: {
    ...settings.stateDesigns,
    [toStateId]: {
      ...settings.stateDesigns[fromStateId],
      patternLayers: settings.stateDesigns[fromStateId].patternLayers.map((layer) => ({
        ...layer,
        id: `${layer.id}-${Date.now().toString(36)}`,
        design: layer.design ? { ...layer.design, frame: layer.design.frame ? { ...layer.design.frame } : undefined } : undefined,
      })),
      ...(settings.stateDesigns[fromStateId].baseDesign
        ? { baseDesign: { ...settings.stateDesigns[fromStateId].baseDesign! } }
        : {}),
      ...(settings.stateDesigns[fromStateId].patternDesign
        ? { patternDesign: { ...settings.stateDesigns[fromStateId].patternDesign! } }
        : {}),
    },
  },
});

export const updateLevelNodePatternLayerFrame = (
  settings: LevelNodeButtonFormatSettings,
  stateId: LevelNodeProgressStateId,
  layerId: string,
  frame: NonNullable<StretchVisualDesign["frame"]>,
): LevelNodeButtonFormatSettings => {
  const design = settings.stateDesigns[stateId];
  const nextLayers = normalizeButtonStatePatternLayerDrafts(design).map((layer) => {
    if (layer.id !== layerId) {
      return layer;
    }

    const nextDesign = layer.design ?? design.patternDesign ?? {
      templateId: "layer-adjust",
      sourceDataUrl: "",
    };

    return {
      ...layer,
      design: {
        ...nextDesign,
        frame,
      },
    };
  });

  return updateLevelNodeStateDesign(settings, stateId, { patternLayers: nextLayers });
};
