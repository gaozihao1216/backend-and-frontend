import {
  createEmptyPatternLayerDraft,
  getButtonStateHasPatternLayers,
  normalizeButtonStatePatternLayerDrafts,
  serializePatternLayersForStateOption,
} from "../../../shared/function/ui-design/button-pattern-layers.js";
import { getStretchVisualDesignStyle } from "../../../shared/components/ui-renderer/ui-renderer-utils.js";
import { isArtTextPreset, resolveTextArtDesign } from "../../../shared/function/ui-design/art-text-styles.js";
import {
  createDefaultWeeklyCheckInChildDrafts,
  weeklyCheckInButtonStates,
} from "../../shared/function/weekly-check-in-panel.js";
import type {
  ButtonImageFrame,
  ButtonStateOption,
  ComponentStyle,
  PageComponent,
  PageConfig,
  PanelComponent,
  PanelDecoration,
} from "../../../../objects/ui-customization/ui-customization-objects.js";
import type {
  ButtonStateDraft,
  PanelChildDraft,
  PositionDraft,
  ResizeHandle,
} from "../objects/panel-create-types.js";
import { pagePreviewAspectRatio } from "../objects/panel-create-types.js";

/**
 * 面板创建向导的草稿到 PageConfig 转换函数。
 *
 * 这里负责按钮状态、模板装饰、奖励数据和子组件布局的组装，
 * hook 层只维护草稿状态和交互。
 */
export const createDefaultPanelChildDrafts = (): PanelChildDraft[] => createDefaultWeeklyCheckInChildDrafts() as PanelChildDraft[];


export const canUseAsParentPanel = (component: PageComponent): component is PanelComponent =>
  component.type === "panel";

export const getPanelDisplayName = (panel: PanelComponent) =>
  panel.title?.trim() || panel.id;

export const createUniqueComponentId = (pageConfig: PageConfig, baseId: string) => {
  const existingIds = new Set(pageConfig.components.map((component) => component.id));
  let index = 1;
  let candidate = baseId;

  while (existingIds.has(candidate)) {
    index += 1;
    candidate = `${baseId}.${index}`;
  }

  return candidate;
};

export const normalizeIdPart = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "panel";
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const createButtonStateOptions = (stateDrafts: ButtonStateDraft[], stateCount: number): ButtonStateOption[] =>
  stateDrafts.slice(0, stateCount).map((state) => {
    const icon = state.icon.trim();
    const contentType = getButtonStateContentType(state);
    const serializedLayers = serializePatternLayersForStateOption(normalizeButtonStatePatternLayerDrafts(state));
    return {
      id: state.id,
      name: state.name,
      label: state.label,
      contentType,
      ...(icon && contentType === "text" ? { icon } : {}),
      ...(state.baseDesign ? { baseDesign: state.baseDesign } : {}),
      ...(contentType === "pattern" && serializedLayers
        ? {
            patternLayers: serializedLayers,
            patternDesign: serializedLayers[0]?.design,
          }
        : {}),
      style: {
        variant: state.variant,
        backgroundColor: state.backgroundColor,
        textColor: state.textColor,
        borderRadius: 12,
      },
    };
  });

export const getButtonStateContentType = (state: ButtonStateDraft): "text" | "pattern" =>
  state.contentType ?? (getButtonStateHasPatternLayers(state) ? "pattern" : "text");

export const applyButtonStateContentType = (
  state: ButtonStateDraft,
  contentType: "text" | "pattern",
): ButtonStateDraft => {
  if (contentType === "pattern") {
    const layers = normalizeButtonStatePatternLayerDrafts(state);
    return {
      ...state,
      contentType: "pattern",
      patternLayers: layers.length > 0 ? layers : [createEmptyPatternLayerDraft(1)],
    };
  }

  const { patternDesign, patternTemplateId, patternTemplateValue, patternLayers, ...rest } = state;
  return {
    ...rest,
    contentType: "text",
    patternTemplateValue: "",
    patternLayers: [],
  };
};

const findParentPanel = (pageConfig: PageConfig, childComponentId: string): PanelComponent | null =>
  pageConfig.components.find(
    (component): component is PanelComponent =>
      component.type === "panel" && component.childComponentIds.includes(childComponentId),
  ) ?? null;

function getPanelContentCanvasAspectRatio(
  pageConfig: PageConfig,
  panel: PanelComponent,
  visitedPanelIds: Set<string>,
): number {
  const panelAspectRatio: number = getPanelRenderedAspectRatio(pageConfig, panel, visitedPanelIds);
  if (!panel.contentSize) {
    return panelAspectRatio;
  }

  return panelAspectRatio * (panel.contentSize.widthPercent / panel.contentSize.heightPercent);
}

function getComponentContainingAspectRatio(
  pageConfig: PageConfig,
  componentId: string,
  visitedPanelIds: Set<string>,
): number {
  const parentPanel = findParentPanel(pageConfig, componentId);
  if (!parentPanel) {
    return pagePreviewAspectRatio;
  }

  return getPanelContentCanvasAspectRatio(pageConfig, parentPanel, visitedPanelIds);
}

export function getPanelRenderedAspectRatio(
  pageConfig: PageConfig,
  panel: PanelComponent | null,
  visitedPanelIds = new Set<string>(),
): number {
  if (!panel || panel.position.height <= 0) {
    return pagePreviewAspectRatio;
  }
  if (visitedPanelIds.has(panel.id)) {
    return pagePreviewAspectRatio;
  }

  const nextVisitedPanelIds = new Set(visitedPanelIds);
  nextVisitedPanelIds.add(panel.id);
  if (panel.position.unit === "px") {
    return clamp(panel.position.width / panel.position.height, 0.25, 4);
  }

  const containingAspectRatio: number = getComponentContainingAspectRatio(pageConfig, panel.id, nextVisitedPanelIds);
  return clamp(containingAspectRatio * (panel.position.width / panel.position.height), 0.25, 4);
}

export const getDecorationStyle = (decoration: PanelDecoration): ComponentStyle => {
  switch (decoration.templateId) {
    case "paper":
      return { backgroundColor: "#fff7e8", textColor: "#423622", borderRadius: 10 };
    case "reward":
      return { backgroundColor: "#fffdfa", textColor: "#182433", borderRadius: 16 };
    case "glass":
      return { backgroundColor: "rgba(244, 249, 255, 0.92)", textColor: "#12385f", borderRadius: 16 };
    case "notice":
      return { backgroundColor: "#f7faf5", textColor: "#203040", borderRadius: 12 };
    case "plain":
    default:
      return { backgroundColor: "#fffdfa", textColor: "#182433", borderRadius: 12 };
  }
};

export const resizePatternFrame = (
  startFrame: ButtonImageFrame,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
): ButtonImageFrame => {
  const minSize = 4;
  const isLeft = handle === "top-left" || handle === "bottom-left";
  const isTop = handle === "top-left" || handle === "top-right";
  let nextX = startFrame.x;
  let nextY = startFrame.y;
  let nextWidth = startFrame.width;
  let nextHeight = startFrame.height;

  if (isLeft) {
    nextX = clamp(startFrame.x + deltaX, -25, startFrame.x + startFrame.width - minSize);
    nextWidth = startFrame.width + startFrame.x - nextX;
  } else {
    nextWidth = clamp(startFrame.width + deltaX, minSize, 125);
  }

  if (isTop) {
    nextY = clamp(startFrame.y + deltaY, -25, startFrame.y + startFrame.height - minSize);
    nextHeight = startFrame.height + startFrame.y - nextY;
  } else {
    nextHeight = clamp(startFrame.height + deltaY, minSize, 125);
  }

  return { x: nextX, y: nextY, width: nextWidth, height: nextHeight };
};

/** 根据面板草稿生成实际写入 PageConfig 的子按钮组件。 */
export const createPanelChildren = (
  panelId: string,
  childDrafts: PanelChildDraft[],
): PageComponent[] => {
  return childDrafts.map((draft): PageComponent => {
    const position = { unit: "percent" as const, ...draft.position };
    if (draft.type === "text") {
      const artTextDesign = draft.artTextDesign;
      const usesArtText = isArtTextPreset(resolveTextArtDesign(artTextDesign).preset);
      return {
        id: `${panelId}.${draft.id}`,
        type: "text",
        text: draft.text,
        position,
        style: usesArtText
          ? { backgroundColor: "transparent" }
          : { backgroundColor: "transparent", textColor: "#203040" },
        ...(artTextDesign ? { artTextDesign } : {}),
      };
    }

    if (draft.type === "subPanel") {
      return {
        id: `${panelId}.${draft.id}`,
        type: "panel",
        kind: "group",
        panelRole: "static",
        title: draft.title,
        position,
        decoration: draft.decoration,
        style: getDecorationStyle(draft.decoration),
        childComponentIds: [],
      };
    }

    const stateOptions = createButtonStateOptions(draft.states, draft.states.length);
    const firstState = stateOptions[0];
    const weeklyDayMatch = draft.id.match(/^day(\d+)$/);
    const isWeeklyDayButton = Boolean(weeklyDayMatch);
    const dayIndex = weeklyDayMatch ? Number(weeklyDayMatch[1]) : 0;
    const fallbackStates = weeklyCheckInButtonStates() as ButtonStateDraft[];
    return {
      id: `${panelId}.${draft.id}`,
      type: "button",
      label: firstState?.label ?? draft.name,
      ...(firstState?.icon ? { icon: firstState.icon } : {}),
      position,
      style: { variant: firstState?.style.variant ?? "primary", borderRadius: 12 },
      stateDesign: {
        defaultStateId: draft.defaultStateId,
        states: stateOptions.length > 0 ? stateOptions : createButtonStateOptions(fallbackStates, 1),
        ...(isWeeklyDayButton
          ? { stateSource: { apiKey: "player.weeklyCheckIn", field: `slots.${dayIndex}` } }
          : {}),
      },
      ...(draft.rewardGrant ? { rewardGrant: draft.rewardGrant } : {}),
      ...(isWeeklyDayButton
        ? { dataSource: { type: "api", apiKey: "player.weeklyCheckIn", refreshMode: "onOpen" } }
        : {}),
      action: draft.id === "close"
        ? { type: "closePanel", panelId }
        : isWeeklyDayButton
          ? {
              type: "apiAction",
              apiKey: "player.weeklyCheckIn.claim",
              params: { panelId, slot: String(dayIndex) },
            }
          : { type: "none" },
    };
  });
};
