import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useDirectorTemplateLibrary } from "../../../shared/hooks/template/useDirectorTemplateLibrary.js";
import {
  createButtonStateDraftPatchFromBaseTemplate,
  createButtonStateDraftPatchFromPatternTemplate,
  createLibraryTemplateSelectOptions,
  getButtonBaseTemplateSelectValue,
  getPanelDecorationSelectValue,
  getPatternLayerTemplateSelectValue,
  resolvePanelDecoration,
} from "../../shared/function/director-template-select.js";
import {
  createDefaultArtTextLayerDraft,
  createEmptyPatternLayerDraft,
  getPatternLayerFrame,
  normalizeButtonStatePatternLayerDrafts,
  type ButtonPatternLayerDraft,
} from "../../../shared/function/ui-design/button-pattern-layers.js";
import { getPageConfig, savePageConfig } from "../../../shared/function/ui-config/ui-customization.js";
import { DEFAULT_STRETCH_VISUAL_FRAME } from "../../../shared/components/ui-renderer/ui-renderer-utils.js";
import type {
  ButtonImageFrame,
  PageConfig,
  PanelComponent,
  PanelDecoration,
  PlayerCurrencyReward,
} from "../../../../objects/ui-customization/ui-customization-objects.js";
import { registerCheckInPanelRewards } from "../../../../api/ui/panelworkflows/RegisterCheckInPanelRewardsApi.js";
import {
  applyWeeklyCheckInRewards,
  defaultWeeklyCheckInRewards,
  extractWeeklyCheckInRewards,
  WEEKLY_CHECK_IN_DAY_COUNT,
} from "../../shared/function/weekly-check-in-panel.js";
import type {
  ButtonStateDraft,
  ChildPointerGesture,
  CreateStep,
  DirectorPanelCreatePageProps,
  DragState,
  PanelChildDraft,
  PanelPreset,
  PatternAdjustRefState,
  PositionDraft,
  ResizeHandle,
} from "../objects/panel-create-types.js";
import { CLICK_DRAG_THRESHOLD_PX } from "../objects/panel-create-types.js";
import {
  canUseAsParentPanel,
  clamp,
  createDefaultPanelChildDrafts,
  createPanelChildren,
  createUniqueComponentId,
  getButtonStateContentType,
  getDecorationStyle,
  getPanelDisplayName,
  getPanelRenderedAspectRatio,
  applyButtonStateContentType,
  normalizeIdPart,
  resizePatternFrame,
} from "../function/panel-create-helpers.js";
import { pagePreviewAspectRatio } from "../objects/panel-create-types.js";
import {
  getPanelCreateMoveTarget,
  getPanelCreateResizeTarget,
  hitTestPanelCreateChild,
  isPanelCreateCanvasInteractiveTarget,
} from "../function/panel-create-canvas.js";

export type DirectorPanelCreateViewModel = ReturnType<typeof useDirectorPanelCreate>;

/**
 * director 面板创建向导状态。
 *
 * 负责多步骤表单、模板选择、签到奖励配置、子按钮拖拽/缩放，
 * 最终把新 panel 和子组件写入目标 PageConfig。
 */
export const useDirectorPanelCreate = ({
  userId,
  pageId,
  targetPath,
  parentPanelId,
  onNavigate,
}: Omit<DirectorPanelCreatePageProps, "onBack">) => {
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
  return {
    userId,
    pageId,
    targetPath,
    templatesLoading,
    templatesError,
    pageConfig,
    step,
    setStep,
    panelPickerOpen,
    setPanelPickerOpen,
    preset,
    setPreset,
    panelTitle,
    setPanelTitle,
    idSeed,
    setIdSeed,
    panelPosition,
    setPanelPosition,
    decoration,
    setDecoration,
    panelChildDrafts,
    setPanelChildDrafts,
    selectedChildDraftId,
    setSelectedChildDraftId,
    feedback,
    previewStateId,
    setPreviewStateId,
    selectedPatternLayerId,
    setSelectedPatternLayerId,
    collapsedPatternLayerKeys,
    beautyPreviewCanvasRef,
    buttonPreviewStageRef,
    availablePanels,
    selectedParentPanelId,
    setSelectedParentPanelId,
    selectedParentPanel,
    parentAspectRatio,
    parentContentSize,
    panelPreviewAspectRatio,
    selectedChildDraft,
    previewButtonState,
    buttonDesignPreviewAspectRatio,
    panelTemplateSelectOptions,
    buttonBaseTemplateSelectOptions,
    patternTemplateSelectOptions,
    panelTemplateMap,
    buttonTemplateMap,
    patternTemplateMap,
    updateChildDraft,
    addSubPanelDraft,
    addMultiStateButtonDraft,
    removeChildDraft,
    moveChildDraft,
    duplicateSubPanelDraft,
    selectedChildDraftIndex,
    updateButtonStateDraft,
    applyBaseTemplateSelection,
    applyPatternLayerTemplateSelection,
    updatePatternLayers,
    updatePatternLayerFrame,
    addPatternLayerDraft,
    removePatternLayerDraft,
    handleButtonPreviewPatternMovePointerDown,
    handleButtonPreviewPatternResizePointerDown,
    handleButtonPreviewPatternPointerMove,
    handleButtonPreviewPatternPointerUp,
    addButtonStateDraft,
    handleBeautyPreviewPointerDown,
    handleBeautyPreviewPointerMove,
    handleBeautyPreviewPointerUp,
    startMovePanel,
    startResizePanel,
    handlePanelPointerMove,
    stopPanelPointer,
    weeklyCheckInRewards,
    isCheckInPreset,
    updateWeeklyCheckInReward,
    handleSave,
    getPatternLayerCardKey,
    isPatternLayerCollapsed,
    togglePatternLayerCollapsed,
    selectPatternLayerForPreview,
    applyButtonStateContentType,
    getButtonStateContentType,
    getPanelDisplayName,
    WEEKLY_CHECK_IN_DAY_COUNT,
  };
};
