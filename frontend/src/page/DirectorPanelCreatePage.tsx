import { useMemo, useRef, useState, type PointerEvent } from "react";
import { getPageConfig, savePageConfig } from "../lib/ui-customization.js";
import type {
  ButtonStateOption,
  ComponentPosition,
  ComponentStyle,
  PageComponent,
  PageConfig,
  PanelComponent,
  PanelDecoration,
} from "../objects/ui-customization/ui-customization-objects.js";

type DirectorPanelCreatePageProps = {
  pageId: string | null;
  targetPath: string;
  parentPanelId: string | null;
  onBack: () => void;
  onNavigate: (nextPath: string) => void;
};

type CreateStep = "basic" | "beauty" | "buttonDesign";
type PanelPreset = "checkIn" | "blank";
type ResizeHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right";
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
type ChildDragState =
  | {
      mode: "move";
      childId: string;
      pointerId: number;
      startX: number;
      startY: number;
      startPosition: PositionDraft;
      stageWidth: number;
      stageHeight: number;
    }
  | {
      mode: "resize";
      childId: string;
      handle: ResizeHandle;
      pointerId: number;
      startX: number;
      startY: number;
      startPosition: PositionDraft;
      stageWidth: number;
      stageHeight: number;
    };

type ButtonStateDraft = {
  id: string;
  name: string;
  label: string;
  icon: string;
  baseTemplateId: NonNullable<ButtonStateOption["baseTemplateId"]>;
  patternTemplateId: NonNullable<ButtonStateOption["patternTemplateId"]>;
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
    }
  | {
      id: string;
      type: "subPanel";
      title: string;
      templateId: NonNullable<PanelDecoration["templateId"]>;
      position: PositionDraft;
    }
  | {
      id: string;
      type: "multiStateButton";
      name: string;
      position: PositionDraft;
      defaultStateId: string;
      states: ButtonStateDraft[];
    };

const defaultCheckInStates: ButtonStateDraft[] = [
  {
    id: "ready",
    name: "正常",
    label: "领取奖励",
    icon: "gift",
    baseTemplateId: "rounded",
    patternTemplateId: "gift",
    variant: "primary",
    backgroundColor: "#2c68a8",
    textColor: "#ffffff",
  },
  {
    id: "claimed",
    name: "已签到",
    label: "已领取",
    icon: "check",
    baseTemplateId: "pill",
    patternTemplateId: "check",
    variant: "secondary",
    backgroundColor: "#dceeff",
    textColor: "#12385f",
  },
  {
    id: "locked",
    name: "暂不可签到",
    label: "明日再来",
    icon: "lock",
    baseTemplateId: "flat",
    patternTemplateId: "lock",
    variant: "ghost",
    backgroundColor: "#f0f3f6",
    textColor: "#6b7785",
  },
];

const buttonBaseTemplateOptions: Array<{ id: ButtonStateDraft["baseTemplateId"]; label: string }> = [
  { id: "rounded", label: "圆角底座" },
  { id: "pill", label: "胶囊底座" },
  { id: "beveled", label: "斜切底座" },
  { id: "flat", label: "平面底座" },
  { id: "glass", label: "玻璃底座" },
];

const buttonPatternTemplateOptions: Array<{ id: ButtonStateDraft["patternTemplateId"]; label: string }> = [
  { id: "none", label: "无图案" },
  { id: "gift", label: "礼物" },
  { id: "check", label: "完成" },
  { id: "lock", label: "锁定" },
  { id: "coin", label: "金币" },
  { id: "calendar", label: "日历" },
  { id: "star", label: "星星" },
];

const createDefaultPanelChildDrafts = (): PanelChildDraft[] => [
  {
    id: "title",
    type: "text",
    text: "每日签到",
    position: { x: 8, y: 8, width: 62, height: 12 },
  },
  {
    id: "hint",
    type: "text",
    text: "今日签到可领取 30 金币，连续签到第 7 天额外获得一次道具抽取。",
    position: { x: 8, y: 26, width: 84, height: 24 },
  },
  {
    id: "reward",
    type: "multiStateButton",
    name: "签到奖励",
    position: { x: 8, y: 62, width: 38, height: 14 },
    defaultStateId: "ready",
    states: defaultCheckInStates,
  },
  {
    id: "close",
    type: "multiStateButton",
    name: "关闭按钮",
    position: { x: 70, y: 62, width: 22, height: 14 },
    defaultStateId: "close",
    states: [
      {
        id: "close",
        name: "正常",
        label: "关闭",
        icon: "x",
        baseTemplateId: "flat",
        patternTemplateId: "none",
        variant: "secondary",
        backgroundColor: "#dceeff",
        textColor: "#12385f",
      },
    ],
  },
];

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
    return {
      id: state.id,
      name: state.name,
      label: state.label,
      ...(icon ? { icon } : {}),
      baseTemplateId: state.baseTemplateId,
      patternTemplateId: state.patternTemplateId,
      style: {
        variant: state.variant,
        backgroundColor: state.backgroundColor,
        textColor: state.textColor,
        borderRadius: 12,
      },
    };
  });

const pagePreviewAspectRatio = 16 / 9;

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

const createPanelChildren = (
  panelId: string,
  childDrafts: PanelChildDraft[],
): PageComponent[] => {
  return childDrafts.map((draft): PageComponent => {
    const position = { unit: "percent" as const, ...draft.position };
    if (draft.type === "text") {
      return {
        id: `${panelId}.${draft.id}`,
        type: "text",
        text: draft.text,
        position,
        style: { backgroundColor: "#ffffff", textColor: "#203040", borderRadius: 10 },
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
        decoration: { templateId: draft.templateId },
        style: getDecorationStyle({ templateId: draft.templateId }),
        childComponentIds: [],
      };
    }

    const stateOptions = createButtonStateOptions(draft.states, draft.states.length);
    const firstState = stateOptions[0];
    return {
      id: `${panelId}.${draft.id}`,
      type: "button",
      label: firstState?.label ?? draft.name,
      ...(firstState?.icon ? { icon: firstState.icon } : {}),
      position,
      style: { variant: firstState?.style.variant ?? "primary", borderRadius: 12 },
      stateDesign: {
        defaultStateId: draft.defaultStateId,
        states: stateOptions.length > 0 ? stateOptions : createButtonStateOptions(defaultCheckInStates, 1),
      },
      action: draft.id === "close" ? { type: "closePanel", panelId } : { type: "none" },
    };
  });
};

export const DirectorPanelCreatePage = ({
  pageId,
  targetPath,
  parentPanelId,
  onBack,
  onNavigate,
}: DirectorPanelCreatePageProps) => {
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(() => pageId ? getPageConfig(pageId) : null);
  const [step, setStep] = useState<CreateStep>("basic");
  const [panelPickerOpen, setPanelPickerOpen] = useState(false);
  const [preset, setPreset] = useState<PanelPreset>("checkIn");
  const [panelTitle, setPanelTitle] = useState("每日签到");
  const [idSeed, setIdSeed] = useState("check-in");
  const [panelPosition, setPanelPosition] = useState<PositionDraft>({ x: 58, y: 12, width: 34, height: 34 });
  const [decoration, setDecoration] = useState<PanelDecoration>({ templateId: "reward", accentColor: "#2c68a8" });
  const [panelChildDrafts, setPanelChildDrafts] = useState<PanelChildDraft[]>(() => createDefaultPanelChildDrafts());
  const [selectedChildDraftId, setSelectedChildDraftId] = useState("reward");
  const [feedback, setFeedback] = useState("");
  const dragStateRef = useRef<DragState | null>(null);
  const childDragStateRef = useRef<ChildDragState | null>(null);

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
        templateId: "notice",
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
            baseTemplateId: "rounded",
            patternTemplateId: "star",
            variant: "primary",
            backgroundColor: "#2c68a8",
            textColor: "#ffffff",
          },
        ],
      },
    ]);
    setSelectedChildDraftId(id);
  };

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
            baseTemplateId: "rounded",
            patternTemplateId: "star",
            variant: "secondary",
            backgroundColor: "#dceeff",
            textColor: "#12385f",
          },
        ],
      };
    });
  };

  const startMoveChildDraft = (childId: string) => (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    const childDraft = panelChildDrafts.find((draft) => draft.id === childId);
    const stage = event.currentTarget.closest<HTMLElement>(".panel-create-beauty-preview");
    const rect = stage?.getBoundingClientRect();
    if (!childDraft || !stage || !rect) {
      return;
    }

    setSelectedChildDraftId(childId);
    childDragStateRef.current = {
      mode: "move",
      childId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: childDraft.position,
      stageWidth: rect.width,
      stageHeight: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startResizeChildDraft = (childId: string, handle: ResizeHandle) => (event: PointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();
    const childDraft = panelChildDrafts.find((draft) => draft.id === childId);
    const stage = event.currentTarget.closest<HTMLElement>(".panel-create-beauty-preview");
    const rect = stage?.getBoundingClientRect();
    if (!childDraft || !stage || !rect) {
      return;
    }

    setSelectedChildDraftId(childId);
    childDragStateRef.current = {
      mode: "resize",
      childId,
      handle,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: childDraft.position,
      stageWidth: rect.width,
      stageHeight: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleChildDraftPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = childDragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = ((event.clientX - dragState.startX) / dragState.stageWidth) * 100;
    const deltaY = ((event.clientY - dragState.startY) / dragState.stageHeight) * 100;
    const start = dragState.startPosition;

    if (dragState.mode === "move") {
      updateChildDraft(dragState.childId, (draft) => ({
        ...draft,
        position: {
          ...start,
          x: clamp(start.x + deltaX, 0, 100 - start.width),
          y: clamp(start.y + deltaY, 0, 100 - start.height),
        },
      } as PanelChildDraft));
      return;
    }

    const minSize = 4;
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

    updateChildDraft(dragState.childId, (draft) => ({
      ...draft,
      position: { x: nextX, y: nextY, width: nextWidth, height: nextHeight },
    } as PanelChildDraft));
  };

  const stopChildDraftPointer = (event: PointerEvent<HTMLElement>) => {
    childDragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
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

  const handleSave = () => {
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
    setFeedback("小面板已创建，返回页面编辑器后可通过按钮配置连接。");
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
          {step === "buttonDesign" ? (
            <button type="button" className="secondary" onClick={() => setStep("beauty")}>
              返回美化信息
            </button>
          ) : null}
          <button
            type="button"
            disabled={!pageConfig || !selectedParentPanel}
            onClick={step === "basic" ? () => setStep("beauty") : handleSave}
          >
            {step === "basic" ? "进入美化面板" : "创建小面板"}
          </button>
        </div>
      </div>

      {!pageId ? <p className="feedback error">缺少 pageId，无法创建小面板。</p> : null}
      {pageId && !pageConfig ? <p className="feedback error">该页面配置不存在。</p> : null}
      {feedback ? <p className="feedback">{feedback}</p> : null}

      {pageConfig ? (
        <>
          <div className="panel-create-step-tabs" aria-label="创建阶段">
            <span className={step === "basic" ? "active" : ""}>1 基础数据</span>
            <span className={step === "beauty" ? "active" : ""}>2 美化信息</span>
            <span className={step === "buttonDesign" ? "active" : ""}>按钮设计</span>
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
                        setPanelTitle("每日签到");
                        setIdSeed("check-in");
                        setDecoration({ templateId: "reward", accentColor: "#2c68a8" });
                        setPanelChildDrafts(createDefaultPanelChildDrafts());
                        setSelectedChildDraftId("reward");
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
                    value={decoration.templateId}
                    onChange={(event) => setDecoration({ ...decoration, templateId: event.target.value as PanelDecoration["templateId"] })}
                  >
                    <option value="plain">普通</option>
                    <option value="paper">纸张</option>
                    <option value="reward">奖励</option>
                    <option value="glass">玻璃</option>
                    <option value="notice">公告</option>
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
                    <h3>选中对象</h3>
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
                      <label className="button-design-field">
                        <span>文本</span>
                        <input
                          value={selectedChildDraft.text}
                          onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                            draft.type === "text" ? { ...draft, text: event.target.value } : draft,
                          )}
                        />
                      </label>
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
                            value={selectedChildDraft.templateId}
                            onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                              draft.type === "subPanel"
                                ? { ...draft, templateId: event.target.value as PanelDecoration["templateId"] }
                                : draft,
                            )}
                          >
                            <option value="plain">普通</option>
                            <option value="paper">纸张</option>
                            <option value="reward">奖励</option>
                            <option value="glass">玻璃</option>
                            <option value="notice">公告</option>
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
                    onPointerMove={handleChildDraftPointerMove}
                    onPointerUp={stopChildDraftPointer}
                    onPointerCancel={stopChildDraftPointer}
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
                        return (
                          <button
                            key={draft.id}
                            type="button"
                            className={`panel-create-preview-text ${selected ? "selected" : ""}`}
                            style={positionStyle}
                            onPointerDown={startMoveChildDraft(draft.id)}
                            onPointerUp={stopChildDraftPointer}
                            onPointerCancel={stopChildDraftPointer}
                            onClick={() => setSelectedChildDraftId(draft.id)}
                          >
                            {draft.text}
                            {selected ? (["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((handle) => (
                              <span
                                key={handle}
                                className={`panel-create-frame-handle ${handle}`}
                                onPointerDown={startResizeChildDraft(draft.id, handle)}
                                onPointerUp={stopChildDraftPointer}
                                onPointerCancel={stopChildDraftPointer}
                              />
                            )) : null}
                          </button>
                        );
                      }
                      if (draft.type === "subPanel") {
                        return (
                          <button
                            key={draft.id}
                            type="button"
                            className={`panel-create-preview-subpanel decoration-${draft.templateId} ${selected ? "selected" : ""}`}
                            style={positionStyle}
                            onPointerDown={startMoveChildDraft(draft.id)}
                            onPointerUp={stopChildDraftPointer}
                            onPointerCancel={stopChildDraftPointer}
                            onClick={() => setSelectedChildDraftId(draft.id)}
                          >
                            {draft.title}
                            {selected ? (["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((handle) => (
                              <span
                                key={handle}
                                className={`panel-create-frame-handle ${handle}`}
                                onPointerDown={startResizeChildDraft(draft.id, handle)}
                                onPointerUp={stopChildDraftPointer}
                                onPointerCancel={stopChildDraftPointer}
                              />
                            )) : null}
                          </button>
                        );
                      }
                      const state = draft.states.find((candidate) => candidate.id === draft.defaultStateId) ?? draft.states[0];
                      return (
                        <button
                          key={draft.id}
                          type="button"
                          className={`dynamic-ui-button panel-create-preview-button ${state?.variant ?? "primary"} base-${state?.baseTemplateId ?? "rounded"} pattern-${state?.patternTemplateId ?? "none"} ${selected ? "selected" : ""}`}
                          style={{
                            ...positionStyle,
                            backgroundColor: state?.backgroundColor,
                            color: state?.textColor,
                            borderRadius: 12,
                          }}
                          onPointerDown={startMoveChildDraft(draft.id)}
                          onPointerUp={stopChildDraftPointer}
                          onPointerCancel={stopChildDraftPointer}
                          onClick={() => setSelectedChildDraftId(draft.id)}
                        >
                          <span className="dynamic-ui-button-content">
                            {state?.icon ? <span className="dynamic-ui-button-icon">{state.icon}</span> : null}
                            <span>{state?.label ?? draft.name}</span>
                          </span>
                          {selected ? (["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((handle) => (
                            <span
                              key={handle}
                              className={`panel-create-frame-handle ${handle}`}
                              onPointerDown={startResizeChildDraft(draft.id, handle)}
                              onPointerUp={stopChildDraftPointer}
                              onPointerCancel={stopChildDraftPointer}
                            />
                          )) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="panel-create-button-design-layout">
              {selectedChildDraft?.type === "multiStateButton" ? (
                <>
                  <section className="panel-create-form">
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
                    <button type="button" onClick={() => addButtonStateDraft(selectedChildDraft.id)}>
                      添加状态
                    </button>
                    <div className="panel-create-state-list">
                      {selectedChildDraft.states.map((state) => (
                        <section key={state.id} className="panel-create-state-card">
                          <div>
                            <strong>{state.name}</strong>
                            <code>{state.id}</code>
                          </div>
                          <label>
                            <span>状态名</span>
                            <input value={state.name} onChange={(event) => updateButtonStateDraft(selectedChildDraft.id, state.id, { name: event.target.value })} />
                          </label>
                          <label>
                            <span>显示文字</span>
                            <input value={state.label} onChange={(event) => updateButtonStateDraft(selectedChildDraft.id, state.id, { label: event.target.value })} />
                          </label>
                          <label>
                            <span>底座模板</span>
                            <select
                              value={state.baseTemplateId}
                              onChange={(event) => updateButtonStateDraft(selectedChildDraft.id, state.id, { baseTemplateId: event.target.value as ButtonStateDraft["baseTemplateId"] })}
                            >
                              {buttonBaseTemplateOptions.map((option) => (
                                <option key={option.id} value={option.id}>{option.label}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>图案模板</span>
                            <select
                              value={state.patternTemplateId}
                              onChange={(event) => updateButtonStateDraft(selectedChildDraft.id, state.id, {
                                patternTemplateId: event.target.value as ButtonStateDraft["patternTemplateId"],
                                icon: event.target.value === "none" ? "" : event.target.value,
                              })}
                            >
                              {buttonPatternTemplateOptions.map((option) => (
                                <option key={option.id} value={option.id}>{option.label}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>样式</span>
                            <select value={state.variant} onChange={(event) => updateButtonStateDraft(selectedChildDraft.id, state.id, { variant: event.target.value as ButtonStateDraft["variant"] })}>
                              <option value="primary">primary</option>
                              <option value="secondary">secondary</option>
                              <option value="ghost">ghost</option>
                            </select>
                          </label>
                          <div className="panel-create-state-colors">
                            <label>
                              <span>背景</span>
                              <input type="color" value={state.backgroundColor} onChange={(event) => updateButtonStateDraft(selectedChildDraft.id, state.id, { backgroundColor: event.target.value })} />
                            </label>
                            <label>
                              <span>文字</span>
                              <input type="color" value={state.textColor} onChange={(event) => updateButtonStateDraft(selectedChildDraft.id, state.id, { textColor: event.target.value })} />
                            </label>
                          </div>
                        </section>
                      ))}
                    </div>
                  </section>
                  <section className="panel-create-preview panel-create-preview-major">
                    <h3>状态预览</h3>
                    <div className="panel-create-button-state-preview">
                      {selectedChildDraft.states.map((state) => (
                        <button
                          key={state.id}
                          type="button"
                          className={`dynamic-ui-button panel-create-button-state-sample ${state.variant} base-${state.baseTemplateId} pattern-${state.patternTemplateId}`}
                          style={{
                            backgroundColor: state.backgroundColor,
                            color: state.textColor,
                            borderRadius: 12,
                          }}
                        >
                          <span className="dynamic-ui-button-content">
                            {state.icon ? <span className="dynamic-ui-button-icon">{state.icon}</span> : null}
                            <span>{state.label}</span>
                          </span>
                        </button>
                      ))}
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
