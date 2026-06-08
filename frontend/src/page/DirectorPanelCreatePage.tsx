import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useDirectorTemplateLibrary } from "../hook/useDirectorTemplateLibrary.js";
import {
  createButtonStateDraftPatchFromBaseTemplate,
  createButtonStateDraftPatchFromPatternTemplate,
  createLibraryTemplateSelectOptions,
  getButtonBaseTemplateSelectValue,
  getPanelDecorationSelectValue,
  getPatternLayerTemplateSelectValue,
  resolvePanelDecoration,
} from "../lib/director-template-select.js";
import {
  createDefaultArtTextLayerDraft,
  createEmptyPatternLayerDraft,
  getArtTextLayerFrameBoxStyle,
  getArtTextLayerLabel,
  getArtTextLayerStyle,
  getButtonStateHasPatternLayers,
  getPatternLayerFrame,
  getPatternLayerFrameBoxStyle,
  normalizeButtonStatePatternLayerDrafts,
  serializePatternLayersForStateOption,
  usesPatternLayerImage,
  type ButtonPatternLayerDraft,
  type PatternLayerResizeHandle,
} from "../lib/button-pattern-layers.js";
import { getPageConfig, savePageConfig } from "../lib/ui-customization.js";
import { getButtonBaseDesignStyle, DEFAULT_STRETCH_VISUAL_FRAME, getStretchVisualDesignStyle } from "../component/ui-renderer/ui-renderer-utils.js";
import type {
  ButtonBaseDesign,
  ButtonImageFrame,
  ButtonStateOption,
  ComponentPosition,
  ComponentStyle,
  PageComponent,
  PageConfig,
  PanelComponent,
  PanelDecoration,
  PlayerCurrencyReward,
  StretchVisualDesign,
  TextArtDesign,
  TextArtGradientDirection,
  TextArtGradientIntensity,
  TextArtPreset,
} from "../objects/ui-customization/ui-customization-objects.js";
import { registerCheckInPanelRewards } from "../api/ui/RegisterCheckInPanelRewardsApi.js";
import {
  getPanelTextArtContainerClassName,
  getPanelTextArtContainerStyle,
  getPanelTextArtContentClassName,
  getPanelTextArtContentStyle,
  getTextArtAccentColor,
  getTextArtAccentHint,
  getTextArtAccentLabel,
  getTextArtGradientDirection,
  getTextArtGradientIntensity,
  isArtTextPreset,
  patchTextArtDesign,
  TEXT_ART_GRADIENT_DIRECTION_OPTIONS,
  TEXT_ART_GRADIENT_INTENSITY_OPTIONS,
  TEXT_ART_PRESET_OPTIONS,
  resolveTextArtDesign,
  usesTextArtGradient,
} from "../lib/art-text-styles.js";
import {
  applyWeeklyCheckInRewards,
  createDefaultWeeklyCheckInChildDrafts,
  defaultWeeklyCheckInRewards,
  extractWeeklyCheckInRewards,
  weeklyCheckInButtonStates,
  WEEKLY_CHECK_IN_DAY_COUNT,
} from "../lib/weekly-check-in-panel.js";

type DirectorPanelCreatePageProps = {
  userId: string;
  pageId: string | null;
  targetPath: string;
  parentPanelId: string | null;
  onBack: () => void;
  onNavigate: (nextPath: string) => void;
};

type CreateStep = "basic" | "beauty" | "rewardConfig" | "buttonDesign";
type PanelPreset = "checkIn" | "blank";
type ResizeHandle = PatternLayerResizeHandle;
type PositionDraft = Pick<ComponentPosition, "x" | "y" | "width" | "height">;
type DragState =
  | {
      mode: "move";
      pointerId: number;
      startX: number;
      startY: number;
      startPosition: PositionDraft;
      stageWidth: number;
      stageHeight: number;
    }
  | {
      mode: "resize";
      handle: ResizeHandle;
      pointerId: number;
      startX: number;
      startY: number;
      startPosition: PositionDraft;
      stageWidth: number;
      stageHeight: number;
    };
type ChildPointerGesture =
  | {
      mode: "click";
      x: number;
      y: number;
      pointerId: number;
      childId: string | null;
    }
  | {
      mode: "move-selected";
      childId: string;
      x: number;
      y: number;
      lastX: number;
      lastY: number;
      pointerId: number;
      parentWidth: number;
      parentHeight: number;
    }
  | {
      mode: "resize-selected";
      childId: string;
      handle: ResizeHandle;
      x: number;
      y: number;
      lastX: number;
      lastY: number;
      pointerId: number;
      parentWidth: number;
      parentHeight: number;
    };

const CLICK_DRAG_THRESHOLD_PX = 6;

const escapeSelectorValue = (value: string) =>
  typeof CSS !== "undefined" && CSS.escape
    ? CSS.escape(value)
    : value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

const isPanelCreateCanvasInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest("button, input, select, textarea, a, label, .panel-create-preview-subpanel-actions"),
  );
};

const getPanelCreateResizeTarget = (
  root: HTMLElement,
  point: { x: number; y: number },
  selectedChildId: string | null,
) => {
  if (!selectedChildId) {
    return null;
  }

  const handleElements = [...root.querySelectorAll<HTMLElement>("[data-panel-create-resize-handle]")];
  const matchedHandle = handleElements.find((handleElement) => {
    const outline = handleElement.closest<HTMLElement>("[data-panel-create-outline-id]");
    if (outline?.dataset.panelCreateOutlineId !== selectedChildId) {
      return false;
    }

    const rect = handleElement.getBoundingClientRect();
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
  });

  const handle = matchedHandle?.dataset.panelCreateResizeHandle as ResizeHandle | undefined;
  if (!matchedHandle || !handle) {
    return null;
  }

  return {
    childId: selectedChildId,
    handle,
    parentWidth: root.clientWidth,
    parentHeight: root.clientHeight,
  };
};

const getPanelCreateMoveTarget = (
  root: HTMLElement,
  point: { x: number; y: number },
  selectedChildId: string | null,
) => {
  if (!selectedChildId) {
    return null;
  }

  const node = root.querySelector<HTMLElement>(
    `[data-panel-create-child-id="${escapeSelectorValue(selectedChildId)}"]`,
  );
  if (!node) {
    return null;
  }

  const rect = node.getBoundingClientRect();
  if (point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom) {
    return null;
  }

  return {
    childId: selectedChildId,
    parentWidth: root.clientWidth,
    parentHeight: root.clientHeight,
  };
};

const hitTestPanelCreateChild = (root: HTMLElement, point: { x: number; y: number }) => {
  const nodes = [...root.querySelectorAll<HTMLElement>("[data-panel-create-child-id]")];
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const node = nodes[index];
    if (!node) {
      continue;
    }

    const rect = node.getBoundingClientRect();
    if (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
      return node.dataset.panelCreateChildId ?? null;
    }
  }

  return null;
};

const PanelCreateChildOutline = ({ childId }: { childId: string }) => (
  <div
    className="panel-create-node-outline state-selected"
    data-panel-create-outline-id={childId}
    aria-hidden="true"
  >
    <span className="panel-create-corner top-left" data-panel-create-resize-handle="top-left" />
    <span className="panel-create-corner top-right" data-panel-create-resize-handle="top-right" />
    <span className="panel-create-corner bottom-left" data-panel-create-resize-handle="bottom-left" />
    <span className="panel-create-corner bottom-right" data-panel-create-resize-handle="bottom-right" />
  </div>
);

type ButtonStateDraft = {
  id: string;
  name: string;
  label: string;
  contentType: "text" | "pattern";
  icon: string;
  baseTemplateValue: string;
  patternTemplateValue: string;
  baseTemplateId?: NonNullable<ButtonStateOption["baseTemplateId"]>;
  patternTemplateId?: NonNullable<ButtonStateOption["patternTemplateId"]>;
  baseDesign?: ButtonBaseDesign;
  patternDesign?: StretchVisualDesign;
  patternLayers: ButtonPatternLayerDraft[];
  variant: NonNullable<ComponentStyle["variant"]>;
  backgroundColor: string;
  textColor: string;
};

type PanelChildDraft =
  | {
      id: string;
      type: "text";
      text: string;
      position: PositionDraft;
      artTextDesign?: TextArtDesign;
    }
  | {
      id: string;
      type: "subPanel";
      title: string;
      decoration: PanelDecoration;
      position: PositionDraft;
    }
  | {
      id: string;
      type: "multiStateButton";
      name: string;
      position: PositionDraft;
      defaultStateId: string;
      states: ButtonStateDraft[];
      rewardGrant?: PlayerCurrencyReward;
    };

const createDefaultPanelChildDrafts = (): PanelChildDraft[] => createDefaultWeeklyCheckInChildDrafts() as PanelChildDraft[];

const pagePreviewAspectRatio = 16 / 9;

const canUseAsParentPanel = (component: PageComponent): component is PanelComponent =>
  component.type === "panel";

const getPanelDisplayName = (panel: PanelComponent) =>
  panel.title?.trim() || panel.id;

const createUniqueComponentId = (pageConfig: PageConfig, baseId: string) => {
  const existingIds = new Set(pageConfig.components.map((component) => component.id));
  let index = 1;
  let candidate = baseId;

  while (existingIds.has(candidate)) {
    index += 1;
    candidate = `${baseId}.${index}`;
  }

  return candidate;
};

const normalizeIdPart = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "panel";
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const createButtonStateOptions = (stateDrafts: ButtonStateDraft[], stateCount: number): ButtonStateOption[] =>
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

const getButtonStateContentType = (state: ButtonStateDraft): "text" | "pattern" =>
  state.contentType ?? (getButtonStateHasPatternLayers(state) ? "pattern" : "text");

const applyButtonStateContentType = (
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

function getPanelRenderedAspectRatio(
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

const getDecorationStyle = (decoration: PanelDecoration): ComponentStyle => {
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

const renderPanelBackgroundLayer = (decoration: PanelDecoration) =>
  decoration.backgroundDesign ? (
    <span
      className="panel-create-background-layer dynamic-ui-panel-background"
      style={getStretchVisualDesignStyle(decoration.backgroundDesign)}
      aria-hidden="true"
    />
  ) : null;

const getButtonStatePreviewClassName = (state: ButtonStateDraft) => {
  const baseId = state.baseDesign ? "library" : "rounded";
  const patternId = getButtonStateHasPatternLayers(state) ? "library" : "none";
  return `${state.variant} base-${baseId} pattern-${patternId}`;
};

const getButtonPreviewStyle = (state: ButtonStateDraft, positionStyle?: CSSProperties): CSSProperties => ({
  ...(positionStyle ?? {}),
  ...(state.baseDesign
    ? { backgroundColor: "#ffffff", borderColor: "transparent", borderRadius: 0, padding: 0 }
    : { backgroundColor: state.backgroundColor, color: state.textColor, borderRadius: 12 }),
});

const resizePatternFrame = (
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

const renderButtonPreviewLayers = (
  state: ButtonStateDraft,
  options?: {
    patternAdjustable?: boolean;
    activeLayerId?: string;
    onPatternMovePointerDown?: (layerId: string) => (event: PointerEvent<HTMLSpanElement>) => void;
    onPatternResizePointerDown?: (layerId: string, handle: ResizeHandle) => (event: PointerEvent<HTMLSpanElement>) => void;
  },
) => {
  const layers = normalizeButtonStatePatternLayerDrafts(state);
  const activeLayerId = options?.activeLayerId ?? layers[layers.length - 1]?.id;

  return (
    <>
      {state.baseDesign ? (
        <span
          className="dynamic-ui-button-base"
          style={getButtonBaseDesignStyle(state.baseDesign)}
          aria-hidden="true"
        >
          {state.baseDesign.scalingMode === "fixedAspect" ? <img src={state.baseDesign.sourceDataUrl} alt="" /> : null}
        </span>
      ) : null}
      {layers.map((layer, index) => {
        if (!layer.design && layer.kind !== "artText") {
          return null;
        }

        const frame = getPatternLayerFrame(layer);
        const isActive = options?.patternAdjustable && layer.id === activeLayerId;
        const usesImage = usesPatternLayerImage(layer);
        const artTextLabel = getArtTextLayerLabel(layer, state.label);

        return (
          <span
            key={layer.id}
            className={`panel-create-button-pattern-frame dynamic-ui-button-pattern-layer ${usesImage ? "" : "dynamic-ui-button-art-text-frame"} ${isActive ? "selected" : ""}`}
            style={usesImage ? getPatternLayerFrameBoxStyle(frame, index) : getArtTextLayerFrameBoxStyle(frame, index)}
            aria-hidden="true"
          >
            {usesImage ? (
              <span
                className={`dynamic-ui-button-pattern ${isActive ? "panel-create-button-pattern-draggable" : ""}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: layer.design ? `url("${layer.design.sourceDataUrl}")` : undefined,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                }}
                onPointerDown={isActive ? options?.onPatternMovePointerDown?.(layer.id) : undefined}
              />
            ) : (
              <span
                className={`dynamic-ui-button-art-text ${isActive ? "panel-create-button-pattern-draggable" : ""}`}
                style={{
                  ...getArtTextLayerStyle({ textColor: state.textColor }),
                  ...(isActive ? { touchAction: "none" as const } : {}),
                }}
                onPointerDown={isActive ? options?.onPatternMovePointerDown?.(layer.id) : undefined}
              >
                {artTextLabel}
              </span>
            )}
            {isActive
              ? (["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((handle) => (
                  <span
                    key={handle}
                    className={`panel-create-pattern-frame-handle ${handle}`}
                    onPointerDown={options?.onPatternResizePointerDown?.(layer.id, handle)}
                  />
                ))
              : null}
          </span>
        );
      })}
    </>
  );
};

const renderButtonPreviewContent = (state: ButtonStateDraft, label?: string) => {
  if (getButtonStateContentType(state) === "pattern" && getButtonStateHasPatternLayers(state)) {
    return null;
  }

  return (
    <span className="dynamic-ui-button-content">
      {state.icon ? <span className="dynamic-ui-button-icon">{state.icon}</span> : null}
      <span>{label ?? state.label}</span>
    </span>
  );
};

const createPanelChildren = (
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

export const DirectorPanelCreatePage = ({
  userId,
  pageId,
  targetPath,
  parentPanelId,
  onBack,
  onNavigate,
}: DirectorPanelCreatePageProps) => {
  const { buttonTemplates, panelTemplates, patternTemplates, loading: templatesLoading, error: templatesError } =
    useDirectorTemplateLibrary(userId);
  const buttonTemplateMap = useMemo(
    () => new Map(buttonTemplates.map((template) => [template.id, template])),
    [buttonTemplates],
  );
  const panelTemplateMap = useMemo(
    () => new Map(panelTemplates.map((template) => [template.id, template])),
    [panelTemplates],
  );
  const patternTemplateMap = useMemo(
    () => new Map(patternTemplates.map((template) => [template.id, template])),
    [patternTemplates],
  );
  const panelTemplateSelectOptions = useMemo(
    () => createLibraryTemplateSelectOptions(panelTemplates),
    [panelTemplates],
  );
  const buttonBaseTemplateSelectOptions = useMemo(
    () => createLibraryTemplateSelectOptions(buttonTemplates),
    [buttonTemplates],
  );
  const patternTemplateSelectOptions = useMemo(
    () => createLibraryTemplateSelectOptions(patternTemplates),
    [patternTemplates],
  );
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(() => pageId ? getPageConfig(pageId) : null);
  const [step, setStep] = useState<CreateStep>("basic");
  const [panelPickerOpen, setPanelPickerOpen] = useState(false);
  const [preset, setPreset] = useState<PanelPreset>("checkIn");
  const [panelTitle, setPanelTitle] = useState("每周签到");
  const [idSeed, setIdSeed] = useState("check-in");
  const [panelPosition, setPanelPosition] = useState<PositionDraft>({ x: 58, y: 12, width: 34, height: 34 });
  const [decoration, setDecoration] = useState<PanelDecoration>({ templateId: "reward", accentColor: "#2c68a8" });
  const [panelChildDrafts, setPanelChildDrafts] = useState<PanelChildDraft[]>(() => createDefaultPanelChildDrafts());
  const [selectedChildDraftId, setSelectedChildDraftId] = useState("day1");
  const [feedback, setFeedback] = useState("");
  const [previewStateId, setPreviewStateId] = useState("");
  const [selectedPatternLayerId, setSelectedPatternLayerId] = useState("");
  const [collapsedPatternLayerKeys, setCollapsedPatternLayerKeys] = useState<Set<string>>(() => new Set());
  const dragStateRef = useRef<DragState | null>(null);
  const childPointerGestureRef = useRef<ChildPointerGesture | null>(null);
  const beautyPreviewCanvasRef = useRef<HTMLDivElement>(null);
  const buttonPreviewStageRef = useRef<HTMLDivElement>(null);
  const patternAdjustRef = useRef<
    | {
        mode: "move";
        stateId: string;
        layerId: string;
        pointerId: number;
        startX: number;
        startY: number;
        startFrame: ButtonImageFrame;
        stageWidth: number;
        stageHeight: number;
      }
    | {
        mode: "resize";
        handle: ResizeHandle;
        stateId: string;
        layerId: string;
        pointerId: number;
        startX: number;
        startY: number;
        startFrame: ButtonImageFrame;
        stageWidth: number;
        stageHeight: number;
      }
    | null
  >(null);

  const availablePanels = useMemo(
    () => pageConfig?.components.filter(canUseAsParentPanel) ?? [],
    [pageConfig],
  );
  const initialParentPanelId =
    parentPanelId && availablePanels.some((panel) => panel.id === parentPanelId)
      ? parentPanelId
      : availablePanels[0]?.id ?? "";
  const [selectedParentPanelId, setSelectedParentPanelId] = useState(initialParentPanelId);
  const selectedParentPanel = availablePanels.find((panel) => panel.id === selectedParentPanelId) ?? null;
  const parentAspectRatio = pageConfig
    ? getPanelRenderedAspectRatio(pageConfig, selectedParentPanel)
    : pagePreviewAspectRatio;
  const parentContentSize = selectedParentPanel?.contentSize;
  const panelPreviewAspectRatio = clamp(
    parentAspectRatio * (panelPosition.width / panelPosition.height),
    0.25,
    4,
  );
  const selectedChildDraft = panelChildDrafts.find((draft) => draft.id === selectedChildDraftId) ?? panelChildDrafts[0] ?? null;

  useEffect(() => {
    if (selectedChildDraft?.type !== "multiStateButton") {
      return;
    }

    setPreviewStateId((current) =>
      selectedChildDraft.states.some((state) => state.id === current)
        ? current
        : selectedChildDraft.defaultStateId,
    );
  }, [selectedChildDraft]);

  const previewButtonState =
    selectedChildDraft?.type === "multiStateButton"
      ? selectedChildDraft.states.find((state) => state.id === previewStateId)
        ?? selectedChildDraft.states.find((state) => state.id === selectedChildDraft.defaultStateId)
        ?? selectedChildDraft.states[0]
        ?? null
      : null;

  useEffect(() => {
    if (!previewButtonState) {
      return;
    }

    const layers = normalizeButtonStatePatternLayerDrafts(previewButtonState);
    setSelectedPatternLayerId((current) =>
      layers.some((layer) => layer.id === current) ? current : layers[layers.length - 1]?.id ?? "",
    );
  }, [previewButtonState]);

  const getPatternLayerCardKey = (childId: string, stateId: string, layerId: string) =>
    `${childId}:${stateId}:${layerId}`;

  const isPatternLayerCollapsed = (childId: string, stateId: string, layerId: string) =>
    collapsedPatternLayerKeys.has(getPatternLayerCardKey(childId, stateId, layerId));

  const expandPatternLayerCard = (childId: string, stateId: string, layerId: string) => {
    setCollapsedPatternLayerKeys((current) => {
      const next = new Set(current);
      next.delete(getPatternLayerCardKey(childId, stateId, layerId));
      return next;
    });
  };

  const togglePatternLayerCollapsed = (childId: string, stateId: string, layerId: string) => {
    const key = getPatternLayerCardKey(childId, stateId, layerId);
    setCollapsedPatternLayerKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectPatternLayerForPreview = (childId: string, stateId: string, layerId: string) => {
    setPreviewStateId(stateId);
    setSelectedPatternLayerId(layerId);
    expandPatternLayerCard(childId, stateId, layerId);
  };

  const buttonDesignPreviewAspectRatio = useMemo(() => {
    if (selectedChildDraft?.type !== "multiStateButton") {
      return 1;
    }

    return clamp(
      panelPreviewAspectRatio * (selectedChildDraft.position.width / selectedChildDraft.position.height),
      0.25,
      4,
    );
  }, [panelPreviewAspectRatio, selectedChildDraft]);

  const updateChildDraft = (childId: string, updater: (draft: PanelChildDraft) => PanelChildDraft) => {
    setPanelChildDrafts((current) =>
      current.map((draft) => draft.id === childId ? updater(draft) : draft),
    );
  };

  const createChildDraftId = (prefix: string) => {
    const existingIds = new Set(panelChildDrafts.map((draft) => draft.id));
    let index = 1;
    let candidate = `${prefix}${index}`;
    while (existingIds.has(candidate)) {
      index += 1;
      candidate = `${prefix}${index}`;
    }
    return candidate;
  };

  const addSubPanelDraft = () => {
    const id = createChildDraftId("subPanel");
    setPanelChildDrafts((current) => [
      ...current,
      {
        id,
        type: "subPanel",
        title: `子面板 ${current.filter((draft) => draft.type === "subPanel").length + 1}`,
        decoration: { templateId: "notice" },
        position: { x: 12, y: 44, width: 34, height: 28 },
      },
    ]);
    setSelectedChildDraftId(id);
  };

  const addMultiStateButtonDraft = () => {
    const id = createChildDraftId("stateButton");
    setPanelChildDrafts((current) => [
      ...current,
      {
        id,
        type: "multiStateButton",
        name: `多状态按钮 ${current.filter((draft) => draft.type === "multiStateButton").length + 1}`,
        position: { x: 52, y: 44, width: 30, height: 12 },
        defaultStateId: "default",
        states: [
          {
            id: "default",
            name: "默认",
            label: "按钮",
            icon: "star",
            contentType: "text",
            baseTemplateValue: "",
            patternTemplateValue: "",
            patternLayers: [],
            variant: "primary",
            backgroundColor: "#2c68a8",
            textColor: "#ffffff",
          },
        ],
      },
    ]);
    setSelectedChildDraftId(id);
  };

  const removeChildDraft = (childId: string) => {
    setPanelChildDrafts((current) => {
      const next = current.filter((draft) => draft.id !== childId);
      setSelectedChildDraftId((selectedId) => {
        if (selectedId !== childId) {
          return selectedId;
        }
        return next[0]?.id ?? "";
      });
      return next;
    });
  };

  const moveChildDraft = (childId: string, direction: -1 | 1) => {
    setPanelChildDrafts((current) => {
      const index = current.findIndex((draft) => draft.id === childId);
      if (index < 0) {
        return current;
      }

      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [movedDraft] = next.splice(index, 1);
      if (!movedDraft) {
        return current;
      }

      next.splice(targetIndex, 0, movedDraft);
      return next;
    });
  };

  const duplicateSubPanelDraft = (childId: string) => {
    const sourceDraft = panelChildDrafts.find(
      (draft): draft is Extract<PanelChildDraft, { type: "subPanel" }> =>
        draft.id === childId && draft.type === "subPanel",
    );
    if (!sourceDraft) {
      return;
    }

    const id = createChildDraftId("subPanel");
    setPanelChildDrafts((current) => [
      ...current,
      {
        ...sourceDraft,
        id,
        title: `${sourceDraft.title} 副本`,
        position: {
          ...sourceDraft.position,
          x: Math.min(92, sourceDraft.position.x + 4),
          y: Math.min(92, sourceDraft.position.y + 4),
        },
      },
    ]);
    setSelectedChildDraftId(id);
  };

  const selectedChildDraftIndex = selectedChildDraft
    ? panelChildDrafts.findIndex((draft) => draft.id === selectedChildDraft.id)
    : -1;

  const updateButtonStateDraft = (
    childId: string,
    stateId: string,
    patch: Partial<ButtonStateDraft>,
  ) => {
    updateChildDraft(childId, (draft) =>
      draft.type === "multiStateButton"
        ? {
            ...draft,
            states: draft.states.map((state) => state.id === stateId ? { ...state, ...patch } : state),
          }
        : draft,
    );
  };

  const applyBaseTemplateSelection = (state: ButtonStateDraft, value: string): ButtonStateDraft => {
    const resolved = createButtonStateDraftPatchFromBaseTemplate(value, buttonTemplateMap);
    if ("baseDesign" in resolved) {
      const { baseTemplateId: _removed, ...rest } = state;
      return { ...rest, ...resolved };
    }

    const { baseDesign: _removed, ...rest } = state;
    return { ...rest, ...resolved };
  };

  const updatePatternLayers = (
    childId: string,
    stateId: string,
    updater: (layers: ButtonPatternLayerDraft[]) => ButtonPatternLayerDraft[],
  ) => {
    updateChildDraft(childId, (draft) =>
      draft.type === "multiStateButton"
        ? {
            ...draft,
            states: draft.states.map((state) =>
              state.id === stateId
                ? { ...state, patternLayers: updater(normalizeButtonStatePatternLayerDrafts(state)) }
                : state,
            ),
          }
        : draft,
    );
  };

  const applyPatternLayerTemplateSelection = (
    layer: ButtonPatternLayerDraft,
    value: string,
  ): ButtonPatternLayerDraft => {
    const resolved = createButtonStateDraftPatchFromPatternTemplate(value, patternTemplateMap);
    if ("patternDesign" in resolved && resolved.patternDesign) {
      return {
        ...layer,
        templateValue: value,
        design: {
          ...resolved.patternDesign,
          frame: layer.design?.frame ?? resolved.patternDesign.frame ?? DEFAULT_STRETCH_VISUAL_FRAME,
        },
      };
    }

    if (!value && layer.kind === "artText") {
      return {
        ...layer,
        templateValue: "",
        design: createDefaultArtTextLayerDraft(1, layer.artTextLabel ?? "").design!,
      };
    }

    if (!value && layer.kind === "pattern") {
      const { design: _removed, ...rest } = layer;
      return {
        ...rest,
        templateValue: "",
      };
    }

    return {
      ...layer,
      templateValue: value,
    };
  };

  const updatePatternLayerFrame = (
    childId: string,
    stateId: string,
    layerId: string,
    frame: ButtonImageFrame,
  ) => {
    updatePatternLayers(childId, stateId, (layers) =>
      layers.map((layer) =>
        layer.id === layerId && layer.design
          ? { ...layer, design: { ...layer.design, frame } }
          : layer.id === layerId && layer.kind === "artText"
            ? {
                ...layer,
                design: {
                  ...(layer.design ?? createDefaultArtTextLayerDraft(1, layer.artTextLabel ?? "").design!),
                  frame,
                },
              }
            : layer,
      ),
    );
  };

  const addPatternLayerDraft = (childId: string, stateId: string, kind: ButtonPatternLayerDraft["kind"]) => {
    updatePatternLayers(childId, stateId, (layers) => {
      const nextIndex = layers.length + 1;
      const nextLayer = kind === "artText"
        ? createDefaultArtTextLayerDraft(nextIndex)
        : createEmptyPatternLayerDraft(nextIndex);
      selectPatternLayerForPreview(childId, stateId, nextLayer.id);
      return [...layers, nextLayer];
    });
  };

  const removePatternLayerDraft = (childId: string, stateId: string, layerId: string) => {
    updatePatternLayers(childId, stateId, (layers) => {
      if (layers.length <= 1) {
        return layers;
      }

      const nextLayers = layers.filter((layer) => layer.id !== layerId);
      setSelectedPatternLayerId(nextLayers[nextLayers.length - 1]?.id ?? "");
      return nextLayers;
    });
  };

  const beginPatternAdjust = (
    stateId: string,
    layerId: string,
    event: PointerEvent<HTMLSpanElement>,
    mode: "move" | "resize",
    handle?: ResizeHandle,
  ) => {
    if (event.button !== 0) {
      return;
    }

    const stage = buttonPreviewStageRef.current;
    const state = selectedChildDraft?.type === "multiStateButton"
      ? selectedChildDraft.states.find((candidate) => candidate.id === stateId)
      : null;
    const layer = state ? normalizeButtonStatePatternLayerDrafts(state).find((candidate) => candidate.id === layerId) : null;
    if (!stage || !layer) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    setSelectedPatternLayerId(layerId);
    expandPatternLayerCard(selectedChildDraft?.id ?? "", stateId, layerId);
    const rect = stage.getBoundingClientRect();
    const startFrame = getPatternLayerFrame(layer);
    if (mode === "resize" && handle) {
      patternAdjustRef.current = {
        mode: "resize",
        handle,
        stateId,
        layerId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startFrame,
        stageWidth: rect.width,
        stageHeight: rect.height,
      };
    } else {
      patternAdjustRef.current = {
        mode: "move",
        stateId,
        layerId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startFrame,
        stageWidth: rect.width,
        stageHeight: rect.height,
      };
    }
    stage.setPointerCapture(event.pointerId);
  };

  const handleButtonPreviewPatternMovePointerDown = (stateId: string, layerId: string) =>
    (event: PointerEvent<HTMLSpanElement>) => {
      beginPatternAdjust(stateId, layerId, event, "move");
    };

  const handleButtonPreviewPatternResizePointerDown = (stateId: string, layerId: string, handle: ResizeHandle) =>
    (event: PointerEvent<HTMLSpanElement>) => {
      beginPatternAdjust(stateId, layerId, event, "resize", handle);
    };

  const handleButtonPreviewPatternPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const adjust = patternAdjustRef.current;
    if (
      !adjust
      || adjust.pointerId !== event.pointerId
      || selectedChildDraft?.type !== "multiStateButton"
    ) {
      return;
    }

    const deltaX = ((event.clientX - adjust.startX) / adjust.stageWidth) * 100;
    const deltaY = ((event.clientY - adjust.startY) / adjust.stageHeight) * 100;
    if (adjust.mode === "move") {
      updatePatternLayerFrame(selectedChildDraft.id, adjust.stateId, adjust.layerId, {
        ...adjust.startFrame,
        x: clamp(adjust.startFrame.x + deltaX, -25, 125),
        y: clamp(adjust.startFrame.y + deltaY, -25, 125),
      });
      return;
    }

    updatePatternLayerFrame(
      selectedChildDraft.id,
      adjust.stateId,
      adjust.layerId,
      resizePatternFrame(adjust.startFrame, adjust.handle, deltaX, deltaY),
    );
  };

  const handleButtonPreviewPatternPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    patternAdjustRef.current = null;
    const stage = buttonPreviewStageRef.current;
    if (stage?.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }
  };

  const addButtonStateDraft = (childId: string) => {
    updateChildDraft(childId, (draft) => {
      if (draft.type !== "multiStateButton") {
        return draft;
      }

      const index = draft.states.length + 1;
      const id = `state${index}`;
      return {
        ...draft,
        states: [
          ...draft.states,
          {
            id,
            name: `状态 ${index}`,
            label: `状态 ${index}`,
            icon: "star",
            contentType: "text",
            baseTemplateValue: "",
            patternTemplateValue: "",
            patternLayers: [],
            variant: "secondary",
            backgroundColor: "#dceeff",
            textColor: "#12385f",
          },
        ],
      };
    });
  };

  const moveChildDraftByDelta = (
    childId: string,
    deltaX: number,
    deltaY: number,
    parentWidth: number,
    parentHeight: number,
  ) => {
    updateChildDraft(childId, (draft) => ({
      ...draft,
      position: {
        ...draft.position,
        x: Math.max(0, draft.position.x + (deltaX / parentWidth) * 100),
        y: Math.max(0, draft.position.y + (deltaY / parentHeight) * 100),
      },
    } as PanelChildDraft));
  };

  const resizeChildDraftByDelta = (
    childId: string,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
    parentWidth: number,
    parentHeight: number,
  ) => {
    updateChildDraft(childId, (draft) => {
      const position = draft.position;
      const deltaUnitX = (deltaX / parentWidth) * 100;
      const deltaUnitY = (deltaY / parentHeight) * 100;
      const minWidth = 2;
      const minHeight = 2;
      const isLeftHandle = handle === "top-left" || handle === "bottom-left";
      const isTopHandle = handle === "top-left" || handle === "top-right";

      let nextX = position.x;
      let nextY = position.y;
      let nextWidth = position.width;
      let nextHeight = position.height;

      if (isLeftHandle) {
        const effectiveDeltaX = Math.min(deltaUnitX, position.width - minWidth);
        nextX = Math.max(0, position.x + effectiveDeltaX);
        nextWidth = Math.max(minWidth, position.width - effectiveDeltaX);
      } else {
        nextWidth = Math.max(minWidth, position.width + deltaUnitX);
      }

      if (isTopHandle) {
        const effectiveDeltaY = Math.min(deltaUnitY, position.height - minHeight);
        nextY = Math.max(0, position.y + effectiveDeltaY);
        nextHeight = Math.max(minHeight, position.height - effectiveDeltaY);
      } else {
        nextHeight = Math.max(minHeight, position.height + deltaUnitY);
      }

      return {
        ...draft,
        position: {
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
        },
      } as PanelChildDraft;
    });
  };

  const handleBeautyPreviewPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    if (isPanelCreateCanvasInteractiveTarget(event.target)) {
      return;
    }

    const canvas = beautyPreviewCanvasRef.current;
    if (!canvas) {
      return;
    }

    const point = { x: event.clientX, y: event.clientY };
    const selectedResizeTarget = getPanelCreateResizeTarget(canvas, point, selectedChildDraftId || null);
    if (selectedResizeTarget) {
      childPointerGestureRef.current = {
        mode: "resize-selected",
        childId: selectedResizeTarget.childId,
        handle: selectedResizeTarget.handle,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        pointerId: event.pointerId,
        parentWidth: selectedResizeTarget.parentWidth,
        parentHeight: selectedResizeTarget.parentHeight,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const selectedMoveTarget = getPanelCreateMoveTarget(canvas, point, selectedChildDraftId || null);
    if (selectedMoveTarget) {
      childPointerGestureRef.current = {
        mode: "move-selected",
        childId: selectedMoveTarget.childId,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        pointerId: event.pointerId,
        parentWidth: selectedMoveTarget.parentWidth,
        parentHeight: selectedMoveTarget.parentHeight,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    childPointerGestureRef.current = {
      mode: "click",
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      childId: hitTestPanelCreateChild(canvas, point),
    };
    if (childPointerGestureRef.current.childId) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handleBeautyPreviewPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    let pointerStart = childPointerGestureRef.current;
    if (!pointerStart || pointerStart.pointerId !== event.pointerId) {
      return;
    }

    if (pointerStart.mode === "click") {
      if (!pointerStart.childId) {
        return;
      }

      const dragDistance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
      if (dragDistance <= CLICK_DRAG_THRESHOLD_PX) {
        return;
      }

      const canvas = beautyPreviewCanvasRef.current;
      if (!canvas) {
        return;
      }

      setSelectedChildDraftId(pointerStart.childId);
      const deltaX = event.clientX - pointerStart.x;
      const deltaY = event.clientY - pointerStart.y;
      pointerStart = {
        mode: "move-selected",
        childId: pointerStart.childId,
        x: pointerStart.x,
        y: pointerStart.y,
        lastX: event.clientX,
        lastY: event.clientY,
        pointerId: event.pointerId,
        parentWidth: canvas.clientWidth,
        parentHeight: canvas.clientHeight,
      };
      childPointerGestureRef.current = pointerStart;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      moveChildDraftByDelta(
        pointerStart.childId,
        deltaX,
        deltaY,
        pointerStart.parentWidth,
        pointerStart.parentHeight,
      );
    }

    if (pointerStart.mode !== "move-selected" && pointerStart.mode !== "resize-selected") {
      return;
    }

    const deltaX = event.clientX - pointerStart.lastX;
    const deltaY = event.clientY - pointerStart.lastY;
    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    if (pointerStart.mode === "move-selected") {
      moveChildDraftByDelta(
        pointerStart.childId,
        deltaX,
        deltaY,
        pointerStart.parentWidth,
        pointerStart.parentHeight,
      );
    } else {
      resizeChildDraftByDelta(
        pointerStart.childId,
        pointerStart.handle,
        deltaX,
        deltaY,
        pointerStart.parentWidth,
        pointerStart.parentHeight,
      );
    }

    childPointerGestureRef.current = {
      ...pointerStart,
      lastX: event.clientX,
      lastY: event.clientY,
    };
  };

  const handleBeautyPreviewPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const pointerStart = childPointerGestureRef.current;
    childPointerGestureRef.current = null;
    if (!pointerStart || pointerStart.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (pointerStart.mode === "move-selected" || pointerStart.mode === "resize-selected") {
      return;
    }

    const dragDistance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    if (dragDistance > CLICK_DRAG_THRESHOLD_PX) {
      return;
    }

    if (pointerStart.childId) {
      setSelectedChildDraftId(pointerStart.childId);
    }
  };

  const startMovePanel = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const stage = event.currentTarget.closest<HTMLElement>(".panel-create-parent-viewport");
    const rect = stage?.getBoundingClientRect();
    if (!stage || !rect) {
      return;
    }

    dragStateRef.current = {
      mode: "move",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: panelPosition,
      stageWidth: rect.width,
      stageHeight: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startResizePanel = (handle: ResizeHandle) => (event: PointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();
    const stage = event.currentTarget.closest<HTMLElement>(".panel-create-parent-viewport");
    const rect = stage?.getBoundingClientRect();
    if (!stage || !rect) {
      return;
    }

    dragStateRef.current = {
      mode: "resize",
      handle,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: panelPosition,
      stageWidth: rect.width,
      stageHeight: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePanelPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = ((event.clientX - dragState.startX) / dragState.stageWidth) * 100;
    const deltaY = ((event.clientY - dragState.startY) / dragState.stageHeight) * 100;
    const start = dragState.startPosition;

    if (dragState.mode === "move") {
      setPanelPosition({
        ...start,
        x: clamp(start.x + deltaX, 0, 100 - start.width),
        y: clamp(start.y + deltaY, 0, 100 - start.height),
      });
      return;
    }

    const minSize = 8;
    const isLeft = dragState.handle === "top-left" || dragState.handle === "bottom-left";
    const isTop = dragState.handle === "top-left" || dragState.handle === "top-right";
    let nextX = start.x;
    let nextY = start.y;
    let nextWidth = start.width;
    let nextHeight = start.height;

    if (isLeft) {
      nextX = clamp(start.x + deltaX, 0, start.x + start.width - minSize);
      nextWidth = start.width + start.x - nextX;
    } else {
      nextWidth = clamp(start.width + deltaX, minSize, 100 - start.x);
    }

    if (isTop) {
      nextY = clamp(start.y + deltaY, 0, start.y + start.height - minSize);
      nextHeight = start.height + start.y - nextY;
    } else {
      nextHeight = clamp(start.height + deltaY, minSize, 100 - start.y);
    }

    setPanelPosition({ x: nextX, y: nextY, width: nextWidth, height: nextHeight });
  };

  const stopPanelPointer = (event: PointerEvent<HTMLElement>) => {
    dragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const weeklyCheckInRewards = useMemo(
    () => extractWeeklyCheckInRewards(panelChildDrafts),
    [panelChildDrafts],
  );
  const isCheckInPreset = preset === "checkIn";

  const updateWeeklyCheckInReward = (
    dayIndex: number,
    field: keyof PlayerCurrencyReward,
    value: number,
  ) => {
    setPanelChildDrafts((current) => {
      const nextRewards = extractWeeklyCheckInRewards(current);
      const currentReward = nextRewards[dayIndex - 1] ?? defaultWeeklyCheckInRewards()[dayIndex - 1]!;
      nextRewards[dayIndex - 1] = {
        ...currentReward,
        [field]: Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0,
      };
      return applyWeeklyCheckInRewards(current, nextRewards);
    });
  };

  const handleSave = async () => {
    if (!pageConfig || !selectedParentPanel) {
      setFeedback("请选择小面板显示时所属的父界面。");
      setStep("basic");
      return;
    }

    const componentIdPrefix = `${selectedParentPanel.id}.${normalizeIdPart(idSeed)}`;
    const panelId = createUniqueComponentId(pageConfig, `${componentIdPrefix}.panel`);
    const childComponents = createPanelChildren(panelId, panelChildDrafts);
    const panelComponent: PanelComponent = {
      id: panelId,
      type: "panel",
      kind: "overlay",
      panelRole: preset === "checkIn" ? "workflowPanel" : "popover",
      title: panelTitle.trim() || "小面板",
      position: { unit: "percent", ...panelPosition },
      decoration,
      floating: {
        anchorComponentId: selectedParentPanel.id,
        placement: "center",
        offsetX: 0,
        offsetY: 0,
      },
      style: getDecorationStyle(decoration),
      childComponentIds: childComponents.map((component) => component.id),
    };
    const nextPageConfig: PageConfig = {
      ...pageConfig,
      components: pageConfig.components
        .map((component) =>
          component.id === selectedParentPanel.id && component.type === "panel"
            ? {
                ...component,
                childComponentIds: [...component.childComponentIds, panelId],
              }
            : component,
        )
        .concat(panelComponent, ...childComponents),
    };

    const savedConfig = savePageConfig(nextPageConfig);
    setPageConfig(savedConfig);

    if (isCheckInPreset) {
      try {
        await registerCheckInPanelRewards(userId, panelId, extractWeeklyCheckInRewards(panelChildDrafts));
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "签到奖励配置同步到后端失败。");
        return;
      }
    }

    setFeedback("小面板已创建，签到规则由系统自动判定，奖励会在领取时写入玩家金币/钻石/碎片。");
    window.setTimeout(() => {
      const builderPath = targetPath === "/" ? "/update" : `${targetPath}/update`;
      onNavigate(`${builderPath}?pageId=${encodeURIComponent(savedConfig.id)}`);
    }, 250);
  };

  return (
    <section className="panel-create-shell">
      <div className="page-builder-toolbar">
        <div>
          <p className="eyebrow">Panel Create</p>
          <h2>创建小面板</h2>
          <p className="panel-copy">先确定父界面和相对位置，再配置面板装饰、特效和按钮状态界面。</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={onBack}>
            返回页面优化
          </button>
          {step === "beauty" ? (
            <button type="button" className="secondary" onClick={() => setStep("basic")}>
              返回基础数据
            </button>
          ) : null}
          {step === "rewardConfig" ? (
            <button type="button" className="secondary" onClick={() => setStep("beauty")}>
              返回美化信息
            </button>
          ) : null}
          {step === "buttonDesign" ? (
            <button type="button" className="secondary" onClick={() => setStep(isCheckInPreset ? "rewardConfig" : "beauty")}>
              返回{isCheckInPreset ? "奖励配置" : "美化信息"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!pageConfig || !selectedParentPanel}
            onClick={() => {
              if (step === "basic") {
                setStep("beauty");
                return;
              }
              if (step === "beauty") {
                setStep(isCheckInPreset ? "rewardConfig" : "buttonDesign");
                return;
              }
              if (step === "rewardConfig") {
                setStep("buttonDesign");
                return;
              }
              void handleSave();
            }}
          >
            {step === "basic"
              ? "进入美化面板"
              : step === "beauty"
                ? isCheckInPreset ? "进入奖励配置" : "进入按钮设计"
                : step === "rewardConfig"
                  ? "进入按钮设计"
                  : "创建小面板"}
          </button>
        </div>
      </div>

      {!pageId ? <p className="feedback error">缺少 pageId，无法创建小面板。</p> : null}
      {pageId && !pageConfig ? <p className="feedback error">该页面配置不存在。</p> : null}
      {feedback ? <p className="feedback">{feedback}</p> : null}
      {templatesError ? <p className="feedback error">{templatesError}</p> : null}
      {templatesLoading ? <p className="meta">正在加载模板库…</p> : null}

      {pageConfig ? (
        <>
          <div className="panel-create-step-tabs" aria-label="创建阶段">
            <span className={step === "basic" ? "active" : ""}>1 基础数据</span>
            <span className={step === "beauty" ? "active" : ""}>2 美化信息</span>
            {isCheckInPreset ? <span className={step === "rewardConfig" ? "active" : ""}>3 奖励配置</span> : null}
            <span className={step === "buttonDesign" ? "active" : ""}>{isCheckInPreset ? "4" : "3"} 按钮设计</span>
          </div>

          {step === "basic" ? (
            <div className="panel-create-basic-layout">
              <section className="panel-create-form">
                <h3>显示的父界面</h3>
                <div className="page-builder-current-panel panel-create-parent-card">
                  <span>小面板会挂在这个父界面下，关卡界面可以作为父界面，按钮不能作为父界面。</span>
                  <div>
                    <code>{selectedParentPanel ? getPanelDisplayName(selectedParentPanel) : "未选择"}</code>
                    <button type="button" className="secondary" onClick={() => setPanelPickerOpen(true)}>
                      修改
                    </button>
                  </div>
                </div>
                <label className="button-design-field">
                  <span>用途模板</span>
                  <select
                    value={preset}
                    onChange={(event) => {
                      const nextPreset = event.target.value as PanelPreset;
                        setPreset(nextPreset);
                      if (nextPreset === "checkIn") {
                        setPanelTitle("每周签到");
                        setIdSeed("check-in");
                        setDecoration({ templateId: "reward", accentColor: "#2c68a8" });
                        setPanelChildDrafts(createDefaultPanelChildDrafts());
                        setSelectedChildDraftId("day1");
                      } else {
                        setPanelTitle("空白小面板");
                        setIdSeed("custom-panel");
                        setDecoration({ templateId: "plain", accentColor: "#2c68a8" });
                        setPanelChildDrafts([]);
                        setSelectedChildDraftId("");
                      }
                    }}
                  >
                    <option value="checkIn">签到小面板</option>
                    <option value="blank">空白小面板</option>
                  </select>
                </label>
                <label className="button-design-field">
                  <span>面板名称</span>
                  <input value={panelTitle} onChange={(event) => setPanelTitle(event.target.value)} />
                </label>
                <label className="button-design-field">
                  <span>ID 前缀</span>
                  <input value={idSeed} onChange={(event) => setIdSeed(event.target.value)} />
                </label>
                <div className="panel-create-position-readout">
                  <span>相对位置</span>
                  <code>
                    x {panelPosition.x.toFixed(1)} · y {panelPosition.y.toFixed(1)} · w {panelPosition.width.toFixed(1)} · h {panelPosition.height.toFixed(1)}
                  </code>
                </div>
              </section>

              <section className="panel-create-preview wide">
                <h3>框选相对位置</h3>
                <div
                  className="panel-create-parent-preview"
                  onPointerMove={handlePanelPointerMove}
                  onPointerUp={stopPanelPointer}
                  onPointerCancel={stopPanelPointer}
                >
                  <div
                    className={`panel-create-parent-viewport ${parentContentSize ? "scroll-parent" : ""}`}
                    style={{ aspectRatio: parentAspectRatio }}
                  >
                    <div className="panel-create-parent-label">
                      <strong>{selectedParentPanel ? getPanelDisplayName(selectedParentPanel) : "父界面"}</strong>
                      <code>{selectedParentPanel?.id ?? "-"}</code>
                      {parentContentSize ? (
                        <span>
                          可滚动内容 {parentContentSize.widthPercent.toFixed(0)}% x {parentContentSize.heightPercent.toFixed(0)}%
                        </span>
                      ) : null}
                    </div>
                    {parentContentSize ? (
                      <div
                        className="panel-create-scroll-content-outline"
                        style={{
                          width: `${parentContentSize.widthPercent}%`,
                          height: `${parentContentSize.heightPercent}%`,
                        }}
                      >
                        <span>滚动内容范围</span>
                      </div>
                    ) : null}
                    <div
                      className="panel-create-frame"
                      style={{
                        left: `${panelPosition.x}%`,
                        top: `${panelPosition.y}%`,
                        width: `${panelPosition.width}%`,
                        height: `${panelPosition.height}%`,
                      }}
                      onPointerDown={startMovePanel}
                      onPointerUp={stopPanelPointer}
                      onPointerCancel={stopPanelPointer}
                    >
                      <strong>{panelTitle || "小面板"}</strong>
                      <span>拖动移动，拉角调整大小</span>
                      {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((handle) => (
                        <span
                          key={handle}
                          className={`panel-create-frame-handle ${handle}`}
                          onPointerDown={startResizePanel(handle)}
                          onPointerUp={stopPanelPointer}
                          onPointerCancel={stopPanelPointer}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : step === "beauty" ? (
            <div className="panel-create-beauty-layout">
              <section className="panel-create-form">
                <h3>面板模板</h3>
                <label className="button-design-field">
                  <span>面板模板</span>
                  <select
                    value={getPanelDecorationSelectValue(decoration)}
                    disabled={templatesLoading}
                    onChange={(event) => {
                      if (!event.target.value) {
                        setDecoration({
                          templateId: decoration.templateId,
                          ...(decoration.accentColor ? { accentColor: decoration.accentColor } : {}),
                        });
                        return;
                      }

                      const nextDecoration = resolvePanelDecoration(
                        event.target.value,
                        panelTemplateMap,
                        decoration.accentColor,
                      );
                      if (nextDecoration) {
                        setDecoration(nextDecoration);
                      }
                    }}
                  >
                    <option value="">
                      {panelTemplateSelectOptions.length > 0 ? "请选择模板" : "暂无模板，请先到模板库创建"}
                    </option>
                    {panelTemplateSelectOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="button-design-color-field">
                  <span>强调色</span>
                  <input
                    type="color"
                    value={decoration.accentColor ?? "#2c68a8"}
                    onChange={(event) => setDecoration({ ...decoration, accentColor: event.target.value })}
                  />
                </label>
                <div className="panel-create-tool-row">
                  <button type="button" onClick={addSubPanelDraft}>
                    添加子面板
                  </button>
                  <button type="button" onClick={addMultiStateButtonDraft}>
                    添加多状态按钮
                  </button>
                </div>
                <div className="panel-create-object-list">
                  {panelChildDrafts.length > 0 ? (
                    panelChildDrafts.map((draft) => (
                      <button
                        key={draft.id}
                        type="button"
                        className={draft.id === selectedChildDraft?.id ? "selected" : ""}
                        onClick={() => setSelectedChildDraftId(draft.id)}
                      >
                        <span>{draft.type === "multiStateButton" ? "多状态按钮" : draft.type === "subPanel" ? "子面板" : "文本"}</span>
                        <strong>{draft.type === "multiStateButton" ? draft.name : draft.type === "subPanel" ? draft.title : draft.text}</strong>
                      </button>
                    ))
                  ) : (
                    <p className="meta">当前面板还没有子对象。</p>
                  )}
                </div>

                {selectedChildDraft ? (
                  <section className="panel-create-selected-editor">
                    <div className="panel-create-selected-editor-header">
                      <h3>选中对象</h3>
                      <div className="panel-create-selected-actions">
                        <button
                          type="button"
                          className="secondary"
                          disabled={selectedChildDraftIndex <= 0}
                          onClick={() => moveChildDraft(selectedChildDraft.id, -1)}
                        >
                          上移
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          disabled={
                            selectedChildDraftIndex < 0
                            || selectedChildDraftIndex >= panelChildDrafts.length - 1
                          }
                          onClick={() => moveChildDraft(selectedChildDraft.id, 1)}
                        >
                          下移
                        </button>
                        {selectedChildDraft.type === "subPanel" ? (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => duplicateSubPanelDraft(selectedChildDraft.id)}
                          >
                            复制
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => removeChildDraft(selectedChildDraft.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <div className="panel-create-position-grid">
                      {(["x", "y", "width", "height"] as const).map((field) => (
                        <label key={field}>
                          <span>{field}</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={selectedChildDraft.position[field]}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value);
                              updateChildDraft(selectedChildDraft.id, (draft) => ({
                                ...draft,
                                position: {
                                  ...draft.position,
                                  [field]: Number.isFinite(nextValue) ? nextValue : draft.position[field],
                                },
                              } as PanelChildDraft));
                            }}
                          />
                        </label>
                      ))}
                    </div>

                    {selectedChildDraft.type === "text" ? (
                      (() => {
                        const textArtDesign = resolveTextArtDesign(selectedChildDraft.artTextDesign);
                        const textPreset = textArtDesign.preset;
                        const showGradientControls = usesTextArtGradient(textPreset);

                        return (
                      <>
                        <label className="button-design-field">
                          <span>文本</span>
                          <input
                            value={selectedChildDraft.text}
                            onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                              draft.type === "text" ? { ...draft, text: event.target.value } : draft,
                            )}
                          />
                        </label>
                        <label className="button-design-field">
                          <span>艺术字样式</span>
                          <select
                            value={textPreset}
                            onChange={(event) => {
                              const nextPreset = event.target.value as TextArtPreset;
                              updateChildDraft(selectedChildDraft.id, (draft) => {
                                if (draft.type !== "text") {
                                  return draft;
                                }

                                return {
                                  ...draft,
                                  artTextDesign: patchTextArtDesign(draft.artTextDesign, { preset: nextPreset }),
                                };
                              });
                            }}
                          >
                            {TEXT_ART_PRESET_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                        <p className="meta panel-create-art-text-hint">
                          {TEXT_ART_PRESET_OPTIONS.find((option) => option.value === textPreset)?.description
                            ?? "选择书法体或渐变艺术字样式。"}
                        </p>
                        {showGradientControls ? (
                          <>
                            <label className="button-design-field">
                              <span>渐变方向</span>
                              <select
                                value={getTextArtGradientDirection(textArtDesign)}
                                onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) => {
                                  if (draft.type !== "text") {
                                    return draft;
                                  }

                                  return {
                                    ...draft,
                                    artTextDesign: patchTextArtDesign(draft.artTextDesign, {
                                      gradientDirection: event.target.value as TextArtGradientDirection,
                                    }),
                                  };
                                })}
                              >
                                {TEXT_ART_GRADIENT_DIRECTION_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </label>
                            <label className="button-design-field">
                              <span>渐变强度</span>
                              <select
                                value={getTextArtGradientIntensity(textArtDesign)}
                                onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) => {
                                  if (draft.type !== "text") {
                                    return draft;
                                  }

                                  return {
                                    ...draft,
                                    artTextDesign: patchTextArtDesign(draft.artTextDesign, {
                                      gradientIntensity: event.target.value as TextArtGradientIntensity,
                                    }),
                                  };
                                })}
                              >
                                {TEXT_ART_GRADIENT_INTENSITY_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </label>
                            <p className="meta panel-create-art-text-hint">
                              {TEXT_ART_GRADIENT_INTENSITY_OPTIONS.find(
                                (option) => option.value === getTextArtGradientIntensity(textArtDesign),
                              )?.description ?? "控制渐变过渡的对比度。"}
                            </p>
                          </>
                        ) : null}
                        {isArtTextPreset(textPreset) ? (
                          <>
                            <label className="button-design-color-field">
                              <span>{getTextArtAccentLabel(textPreset)}</span>
                              <input
                                type="color"
                                value={getTextArtAccentColor(textArtDesign)}
                                onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) => {
                                  if (draft.type !== "text") {
                                    return draft;
                                  }

                                  return {
                                    ...draft,
                                    artTextDesign: patchTextArtDesign(draft.artTextDesign, {
                                      accentColor: event.target.value,
                                    }),
                                  };
                                })}
                              />
                            </label>
                            <p className="meta panel-create-art-text-hint">{getTextArtAccentHint(textPreset)}</p>
                          </>
                        ) : null}
                      </>
                        );
                      })()
                    ) : null}

                    {selectedChildDraft.type === "subPanel" ? (
                      <>
                        <label className="button-design-field">
                          <span>子面板名</span>
                          <input
                            value={selectedChildDraft.title}
                            onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                              draft.type === "subPanel" ? { ...draft, title: event.target.value } : draft,
                            )}
                          />
                        </label>
                        <label className="button-design-field">
                          <span>模板</span>
                          <select
                            value={getPanelDecorationSelectValue(selectedChildDraft.decoration)}
                            disabled={templatesLoading}
                            onChange={(event) => {
                              if (!event.target.value) {
                                updateChildDraft(selectedChildDraft.id, (draft) =>
                                  draft.type === "subPanel"
                                    ? {
                                        ...draft,
                                        decoration: {
                                          templateId: draft.decoration.templateId,
                                          ...(draft.decoration.accentColor
                                            ? { accentColor: draft.decoration.accentColor }
                                            : {}),
                                        },
                                      }
                                    : draft,
                                );
                                return;
                              }

                              const nextDecoration = resolvePanelDecoration(event.target.value, panelTemplateMap);
                              if (!nextDecoration) {
                                return;
                              }

                              updateChildDraft(selectedChildDraft.id, (draft) =>
                                draft.type === "subPanel" ? { ...draft, decoration: nextDecoration } : draft,
                              );
                            }}
                          >
                            <option value="">
                              {panelTemplateSelectOptions.length > 0 ? "请选择模板" : "暂无模板，请先到模板库创建"}
                            </option>
                            {panelTemplateSelectOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                      </>
                    ) : null}

                    {selectedChildDraft.type === "multiStateButton" ? (
                      <>
                        <label className="button-design-field">
                          <span>按钮名</span>
                          <input
                            value={selectedChildDraft.name}
                            onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                              draft.type === "multiStateButton" ? { ...draft, name: event.target.value } : draft,
                            )}
                          />
                        </label>
                        <button type="button" onClick={() => setStep("buttonDesign")}>
                          按钮设计
                        </button>
                      </>
                    ) : null}
                  </section>
                ) : null}
              </section>

              <section className="panel-create-preview panel-create-preview-major">
                <h3>面板预览</h3>
                <div className="panel-create-beauty-stage">
                  <div
                    className={`panel-create-beauty-preview decoration-${decoration.templateId}`}
                    style={{
                      ...getDecorationStyle(decoration),
                      aspectRatio: panelPreviewAspectRatio,
                      borderColor: decoration.accentColor,
                    }}
                  >
                    {renderPanelBackgroundLayer(decoration)}
                    <div
                      ref={beautyPreviewCanvasRef}
                      className="panel-create-beauty-canvas"
                      onPointerDown={handleBeautyPreviewPointerDown}
                      onPointerMove={handleBeautyPreviewPointerMove}
                      onPointerUp={handleBeautyPreviewPointerUp}
                      onPointerCancel={handleBeautyPreviewPointerUp}
                    >
                      {panelChildDrafts.map((draft) => {
                        const positionStyle = {
                          left: `${draft.position.x}%`,
                          top: `${draft.position.y}%`,
                          width: `${draft.position.width}%`,
                          height: `${draft.position.height}%`,
                        };
                        const selected = draft.id === selectedChildDraft?.id;
                        if (draft.type === "text") {
                          const artTextDesign = draft.artTextDesign;
                          const usesArtText = isArtTextPreset(resolveTextArtDesign(artTextDesign).preset);
                          return (
                            <div
                              key={draft.id}
                              data-panel-create-child-id={draft.id}
                              className={`panel-create-preview-text ${usesArtText ? "is-art-text" : ""} ${selected ? "selected" : ""}`.trim()}
                              style={{
                                ...positionStyle,
                                ...getPanelTextArtContainerStyle(artTextDesign),
                              }}
                            >
                              {usesArtText ? (
                                <span
                                  className={getPanelTextArtContentClassName(artTextDesign)}
                                  style={getPanelTextArtContentStyle(artTextDesign, { interactive: true })}
                                >
                                  {draft.text}
                                </span>
                              ) : draft.text}
                              {selected ? <PanelCreateChildOutline childId={draft.id} /> : null}
                            </div>
                          );
                        }
                        if (draft.type === "subPanel") {
                          return (
                            <div
                              key={draft.id}
                              data-panel-create-child-id={draft.id}
                              className={`panel-create-preview-subpanel decoration-${draft.decoration.templateId} ${selected ? "selected" : ""}`}
                              style={{
                                ...positionStyle,
                                ...getDecorationStyle(draft.decoration),
                              }}
                            >
                              {renderPanelBackgroundLayer(draft.decoration)}
                              {draft.title}
                              {selected ? (
                                <>
                                  <PanelCreateChildOutline childId={draft.id} />
                                  <div
                                    className="panel-create-preview-subpanel-actions"
                                    onPointerDown={(event) => {
                                      event.stopPropagation();
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className="secondary"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        duplicateSubPanelDraft(draft.id);
                                      }}
                                    >
                                      复制
                                    </button>
                                    <button
                                      type="button"
                                      className="secondary"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        removeChildDraft(draft.id);
                                      }}
                                    >
                                      删除
                                    </button>
                                  </div>
                                </>
                              ) : null}
                            </div>
                          );
                        }
                        const state = draft.states.find((candidate) => candidate.id === draft.defaultStateId) ?? draft.states[0];
                        if (!state) {
                          return null;
                        }

                        return (
                          <div
                            key={draft.id}
                            data-panel-create-child-id={draft.id}
                            className={`dynamic-ui-button panel-create-preview-button ${getButtonStatePreviewClassName(state)} ${selected ? "selected" : ""}`}
                            style={getButtonPreviewStyle(state, positionStyle)}
                          >
                            {renderButtonPreviewLayers(state)}
                            {renderButtonPreviewContent(state, draft.name)}
                            {selected ? <PanelCreateChildOutline childId={draft.id} /> : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : step === "rewardConfig" ? (
            <section className="panel-create-form panel-create-reward-config">
              <h3>每周签到奖励配置</h3>
              <p className="meta">
                签到规则（例如本周已签 3 次、今天未签，则第 4 个按钮可领）由系统自动判定，不需要在这里可视化编辑。
                你只需配置每个按钮领取时增加到玩家账户的金币、钻石、碎片。
              </p>
              <div className="panel-create-reward-table-wrap">
                <table className="panel-create-reward-table">
                  <thead>
                    <tr>
                      <th>签到按钮</th>
                      <th>金币</th>
                      <th>钻石</th>
                      <th>碎片</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: WEEKLY_CHECK_IN_DAY_COUNT }, (_, index) => {
                      const dayIndex = index + 1;
                      const reward = weeklyCheckInRewards[index] ?? defaultWeeklyCheckInRewards()[index]!;
                      return (
                        <tr key={dayIndex}>
                          <th scope="row">第 {dayIndex} 天</th>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={reward.coins}
                              onChange={(event) => updateWeeklyCheckInReward(dayIndex, "coins", Number(event.target.value))}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={reward.gems}
                              onChange={(event) => updateWeeklyCheckInReward(dayIndex, "gems", Number(event.target.value))}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={reward.fragments}
                              onChange={(event) => updateWeeklyCheckInReward(dayIndex, "fragments", Number(event.target.value))}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="meta panel-create-reward-footnote">
                示例：玩家本周已签到 3 次且今天还没签，则第 4 个按钮变为可领取；点击后会按上表奖励增加玩家资产，并切换到已领取状态。
              </p>
            </section>
          ) : (
            <div className="panel-create-button-design-layout">
              {selectedChildDraft?.type === "multiStateButton" ? (
                <>
                  <section className="panel-create-button-design-header">
                    <div className="panel-create-button-design-basics panel-create-form">
                      <h3>按钮设计</h3>
                      <label className="button-design-field">
                        <span>按钮名</span>
                        <input
                          value={selectedChildDraft.name}
                          onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                            draft.type === "multiStateButton" ? { ...draft, name: event.target.value } : draft,
                          )}
                        />
                      </label>
                      <div className="panel-create-button-meta-row">
                        <label className="button-design-field">
                          <span>状态数</span>
                          <input value={selectedChildDraft.states.length} readOnly />
                        </label>
                        <label className="button-design-field">
                          <span>默认状态</span>
                          <select
                            value={selectedChildDraft.defaultStateId}
                            onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                              draft.type === "multiStateButton" ? { ...draft, defaultStateId: event.target.value } : draft,
                            )}
                          >
                            {selectedChildDraft.states.map((state) => (
                              <option key={state.id} value={state.id}>{state.name}</option>
                            ))}
                          </select>
                        </label>
                        <label className="button-design-field">
                          <span>预览状态</span>
                          <select
                            value={previewStateId}
                            onChange={(event) => setPreviewStateId(event.target.value)}
                          >
                            {selectedChildDraft.states.map((state) => (
                              <option key={state.id} value={state.id}>{state.name}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="panel-create-button-state-names">
                        <span className="panel-create-button-state-names-label">状态命名</span>
                        <div className="panel-create-button-state-names-grid">
                          {selectedChildDraft.states.map((state, index) => (
                            <label key={state.id} className="panel-create-button-state-name-field">
                              <span>状态 {index + 1}</span>
                              <input
                                value={state.name}
                                onChange={(event) => updateButtonStateDraft(selectedChildDraft.id, state.id, { name: event.target.value })}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                      <button type="button" onClick={() => addButtonStateDraft(selectedChildDraft.id)}>
                        添加状态
                      </button>
                    </div>
                    <section className="panel-create-button-design-preview panel-create-preview">
                      <h3>按钮预览</h3>
                      <p className="meta">
                        预览比例与「美化信息」中该按钮一致。艺术字以文本框为边界，拖动框体移动位置，拖拽四角放大缩小字框（字号随框体同步变化）。
                      </p>
                      {previewButtonState && selectedChildDraft.type === "multiStateButton" ? (
                        <div className="panel-create-button-single-preview">
                          <div
                            ref={buttonPreviewStageRef}
                            className="panel-create-button-single-preview-stage"
                            style={{ aspectRatio: buttonDesignPreviewAspectRatio }}
                            onPointerMove={handleButtonPreviewPatternPointerMove}
                            onPointerUp={handleButtonPreviewPatternPointerUp}
                            onPointerCancel={handleButtonPreviewPatternPointerUp}
                          >
                            <div
                              className={`dynamic-ui-button panel-create-button-state-sample ${getButtonStatePreviewClassName(previewButtonState)}`}
                              style={{
                                ...getButtonPreviewStyle(previewButtonState),
                                position: "absolute",
                                inset: 0,
                                width: "auto",
                                height: "auto",
                              }}
                            >
                              {renderButtonPreviewLayers(previewButtonState, {
                                patternAdjustable: getButtonStateContentType(previewButtonState) === "pattern",
                                activeLayerId: selectedPatternLayerId,
                                onPatternMovePointerDown: (layerId) =>
                                  handleButtonPreviewPatternMovePointerDown(previewButtonState.id, layerId),
                                onPatternResizePointerDown: (layerId, handle) =>
                                  handleButtonPreviewPatternResizePointerDown(previewButtonState.id, layerId, handle),
                              })}
                              {renderButtonPreviewContent(previewButtonState)}
                            </div>
                          </div>
                          <code className="panel-create-button-aspect-readout">
                            宽高比 {selectedChildDraft.position.width}:{selectedChildDraft.position.height}
                          </code>
                        </div>
                      ) : null}
                    </section>
                  </section>

                  <section className="panel-create-button-design-states panel-create-form">
                    <h3>状态设计</h3>
                    <p className="meta">
                      每个状态一列。文本型只需配置显示文字和底座模板；图案型可叠加多个图案/艺术字图层，并分别调节位置与大小。
                    </p>
                    <div className="panel-create-button-state-columns">
                      {selectedChildDraft.states.map((state) => {
                        const contentType = getButtonStateContentType(state);
                        return (
                        <section key={state.id} className="panel-create-button-state-column">
                          <header
                            className="panel-create-button-state-column-header"
                            onClick={() => setPreviewStateId(state.id)}
                          >
                            <strong>{state.name}</strong>
                            <code>{state.id}</code>
                          </header>
                          <label className="button-design-field">
                            <span>按钮类型</span>
                            <select
                              value={contentType}
                              onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                                draft.type === "multiStateButton"
                                  ? {
                                      ...draft,
                                      states: draft.states.map((candidate) =>
                                        candidate.id === state.id
                                          ? applyButtonStateContentType(candidate, event.target.value as "text" | "pattern")
                                          : candidate,
                                      ),
                                    }
                                  : draft,
                              )}
                            >
                              <option value="text">文本型</option>
                              <option value="pattern">图案型</option>
                            </select>
                          </label>
                          <label className="button-design-field">
                            <span>底座模板</span>
                            <select
                              value={getButtonBaseTemplateSelectValue(state)}
                              disabled={templatesLoading}
                              onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                                draft.type === "multiStateButton"
                                  ? {
                                      ...draft,
                                      states: draft.states.map((candidate) =>
                                        candidate.id === state.id
                                          ? applyBaseTemplateSelection(candidate, event.target.value)
                                          : candidate,
                                      ),
                                    }
                                  : draft,
                              )}
                            >
                              <option value="">
                                {buttonBaseTemplateSelectOptions.length > 0 ? "请选择底座模板" : "暂无底座模板"}
                              </option>
                              {buttonBaseTemplateSelectOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </label>
                          {contentType === "text" ? (
                            <label className="button-design-field">
                              <span>显示文字</span>
                              <input
                                value={state.label}
                                onChange={(event) => updateButtonStateDraft(selectedChildDraft.id, state.id, { label: event.target.value })}
                              />
                            </label>
                          ) : (
                            <div className="panel-create-pattern-layers">
                              {normalizeButtonStatePatternLayerDrafts(state).map((layer, layerIndex) => {
                                const layerFrame = getPatternLayerFrame(layer);
                                const layerCollapsed = isPatternLayerCollapsed(selectedChildDraft.id, state.id, layer.id);
                                return (
                                <article
                                  key={layer.id}
                                  className={`panel-create-pattern-layer-card ${selectedPatternLayerId === layer.id && previewStateId === state.id ? "selected" : ""} ${layerCollapsed ? "collapsed" : ""}`}
                                >
                                  <header className="panel-create-pattern-layer-card-header">
                                    <div className="panel-create-pattern-layer-card-title-row">
                                      <button
                                        type="button"
                                        className="panel-create-pattern-layer-toggle secondary"
                                        aria-expanded={!layerCollapsed}
                                        onClick={() => togglePatternLayerCollapsed(selectedChildDraft.id, state.id, layer.id)}
                                      >
                                        {layerCollapsed ? "展开" : "收起"}
                                      </button>
                                      <strong className="panel-create-pattern-layer-card-title">{layer.name}</strong>
                                      <code className="panel-create-pattern-layer-kind-badge">
                                        {layer.kind === "artText" ? "艺术字" : "图案"}
                                      </code>
                                    </div>
                                    {layerCollapsed ? (
                                      <p className="meta panel-create-pattern-layer-summary">
                                        {layer.kind === "artText"
                                          ? `文案：${layer.artTextLabel?.trim() || state.label}`
                                          : getPatternLayerTemplateSelectValue(layer)
                                            ? "已选模板"
                                            : "未选模板"}
                                        {" · "}
                                        X {layerFrame.x}% · Y {layerFrame.y}% · 字框 {layerFrame.width}%×{layerFrame.height}%
                                      </p>
                                    ) : null}
                                    <div className="panel-create-pattern-layer-card-actions">
                                      <button
                                        type="button"
                                        className="secondary"
                                        onClick={() => selectPatternLayerForPreview(selectedChildDraft.id, state.id, layer.id)}
                                      >
                                        编辑
                                      </button>
                                      {normalizeButtonStatePatternLayerDrafts(state).length > 1 ? (
                                        <button
                                          type="button"
                                          className="secondary"
                                          onClick={() => removePatternLayerDraft(selectedChildDraft.id, state.id, layer.id)}
                                        >
                                          删除
                                        </button>
                                      ) : null}
                                    </div>
                                  </header>
                                  {!layerCollapsed ? (
                                  <div className="panel-create-pattern-layer-card-body">
                                  <label className="panel-create-button-state-name-field">
                                    <span>图层名</span>
                                    <input
                                      value={layer.name}
                                      onChange={(event) => updatePatternLayers(selectedChildDraft.id, state.id, (layers) =>
                                        layers.map((candidate) =>
                                          candidate.id === layer.id ? { ...candidate, name: event.target.value } : candidate,
                                        ),
                                      )}
                                    />
                                  </label>
                                  <label className="button-design-field">
                                    <span>图层类型</span>
                                    <select
                                      value={layer.kind}
                                      onChange={(event) => updatePatternLayers(selectedChildDraft.id, state.id, (layers) =>
                                        layers.map((candidate) => {
                                          if (candidate.id !== layer.id) {
                                            return candidate;
                                          }

                                          const kind = event.target.value as ButtonPatternLayerDraft["kind"];
                                          if (kind === "artText") {
                                            return {
                                              ...createDefaultArtTextLayerDraft(layerIndex + 1, state.label),
                                              id: candidate.id,
                                              name: candidate.name,
                                            };
                                          }

                                          return {
                                            ...createEmptyPatternLayerDraft(layerIndex + 1),
                                            id: candidate.id,
                                            name: candidate.name,
                                          };
                                        }),
                                      )}
                                    >
                                      <option value="pattern">图案</option>
                                      <option value="artText">艺术字</option>
                                    </select>
                                  </label>
                                  {layer.kind === "artText" ? (
                                    <label className="button-design-field">
                                      <span>艺术字文案</span>
                                      <input
                                        value={layer.artTextLabel ?? state.label}
                                        onChange={(event) => updatePatternLayers(selectedChildDraft.id, state.id, (layers) =>
                                          layers.map((candidate) =>
                                            candidate.id === layer.id
                                              ? { ...candidate, artTextLabel: event.target.value }
                                              : candidate,
                                          ),
                                        )}
                                      />
                                    </label>
                                  ) : null}
                                  <label className="button-design-field">
                                    <span>{layer.kind === "artText" ? "艺术字图片（可选）" : "图案模板"}</span>
                                    <select
                                      value={getPatternLayerTemplateSelectValue(layer)}
                                      disabled={templatesLoading}
                                      onChange={(event) => updatePatternLayers(selectedChildDraft.id, state.id, (layers) =>
                                        layers.map((candidate) =>
                                          candidate.id === layer.id
                                            ? applyPatternLayerTemplateSelection(candidate, event.target.value)
                                            : candidate,
                                        ),
                                      )}
                                    >
                                      <option value="">
                                        {layer.kind === "artText"
                                          ? "使用 CSS 渐变艺术字"
                                          : patternTemplateSelectOptions.length > 0
                                            ? "请选择图案模板"
                                            : "暂无图案模板"}
                                      </option>
                                      {patternTemplateSelectOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </select>
                                  </label>
                                  <div className="panel-create-pattern-frame-grid">
                                    {(["x", "y", "width", "height"] as const).map((field) => (
                                      <label key={field} className="panel-create-button-state-name-field">
                                        <span>
                                          {layer.kind === "artText"
                                            ? field === "x"
                                              ? "字框 X"
                                              : field === "y"
                                                ? "字框 Y"
                                                : field === "width"
                                                  ? "字框宽"
                                                  : "字框高"
                                            : field === "x"
                                              ? "X"
                                              : field === "y"
                                                ? "Y"
                                                : field === "width"
                                                  ? "宽"
                                                  : "高"}
                                        </span>
                                        <input
                                          type="number"
                                          min={field === "x" || field === "y" ? -25 : 4}
                                          max={125}
                                          step={0.5}
                                          value={layerFrame[field]}
                                          onChange={(event) => {
                                            const nextValue = Number(event.target.value);
                                            if (!Number.isFinite(nextValue)) {
                                              return;
                                            }

                                            updatePatternLayerFrame(selectedChildDraft.id, state.id, layer.id, {
                                              ...layerFrame,
                                              [field]: nextValue,
                                            });
                                          }}
                                        />
                                      </label>
                                    ))}
                                  </div>
                                  </div>
                                  ) : null}
                                </article>
                                );
                              })}
                              <div className="panel-create-pattern-layer-add-actions">
                                <button type="button" onClick={() => addPatternLayerDraft(selectedChildDraft.id, state.id, "pattern")}>
                                  添加图案图层
                                </button>
                                <button type="button" className="secondary" onClick={() => addPatternLayerDraft(selectedChildDraft.id, state.id, "artText")}>
                                  添加艺术字图层
                                </button>
                              </div>
                              <p className="meta panel-create-art-text-hint">
                                CSS 艺术字会把文案放进可编辑的字框里：字框越大字越大。也可上传 PNG 艺术字图片替代。
                              </p>
                            </div>
                          )}
                        </section>
                        );
                      })}
                    </div>
                  </section>
                </>
              ) : (
                <section className="panel-create-form">
                  <h3>按钮设计</h3>
                  <p className="meta">请先返回美化信息并选择一个多状态按钮。</p>
                </section>
              )}
            </div>
          )}
        </>
      ) : null}

      {panelPickerOpen && pageConfig ? (
        <div className="page-builder-dialog-backdrop" role="presentation">
          <section className="page-builder-dialog" role="dialog" aria-modal="true" aria-label="选择父界面">
            <div className="page-builder-dialog-header">
              <div>
                <p className="eyebrow">Parent Panel</p>
                <h3>选择显示的父界面</h3>
              </div>
              <button type="button" className="secondary" onClick={() => setPanelPickerOpen(false)}>
                关闭
              </button>
            </div>
            <div className="page-builder-directory-list">
              {availablePanels.map((panel) => (
                <button
                  key={panel.id}
                  type="button"
                  className={panel.id === selectedParentPanelId ? "selected" : ""}
                  onClick={() => {
                    setSelectedParentPanelId(panel.id);
                    setPanelPickerOpen(false);
                  }}
                >
                  <span>{panel.kind === "stage" ? "关卡界面" : "界面"}</span>
                  <strong>{getPanelDisplayName(panel)}</strong>
                  <code>{panel.id}</code>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
};
