import { useEffect, useRef, useMemo, useState, type PointerEvent, type WheelEvent } from "react";
import { getPageConfig, savePageConfig } from "../lib/ui-customization.js";
import {
  getPanelTextArtContainerStyle,
  getPanelTextArtContentClassName,
  getPanelTextArtContentStyle,
  isArtTextPreset,
  resolveTextArtDesign,
} from "../lib/art-text-styles.js";
import { PageBuilderTextObjectEditor } from "../component/director/PageBuilderTextObjectEditor.js";
import { DynamicPageRenderer } from "../component/ui-renderer/index.js";
import { isStaticPageSupported } from "./StaticPageRenderer.js";
import { UiActualPagePreview } from "./UiActualPagePreview.js";
import { getTextContentMode, resolveTextComponentContent } from "../lib/dynamic-text-program.js";
import {
  getButtonBaseDesignStyle,
  getButtonImageDesignStyle,
  getButtonTextScaleStyle,
  getComponentStyle,
  getPositionStyle,
  getRootComponents,
} from "../component/ui-renderer/ui-renderer-utils.js";
import {
  getUiPreviewUser,
  type PageComponent,
  type PageConfig,
  type PanelComponent,
  type TextComponent,
} from "../objects/ui-customization/ui-customization-objects.js";

type DirectorPageBuilderPageProps = {
  pageId: string | null;
  targetPath?: string;
  onBack: () => void;
  onNavigate: (nextPath: string) => void;
};

type OutlineSelectionState = "idle" | "pending" | "selected";
type PointerGestureState =
  | {
      mode: "click";
      x: number;
      y: number;
      pointerId: number;
    }
  | {
      mode: "move-selected";
      componentId: string;
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
      componentId: string;
      handle: ResizeHandle;
      x: number;
      y: number;
      lastX: number;
      lastY: number;
      pointerId: number;
      parentWidth: number;
      parentHeight: number;
    }
  | {
      mode: "selected-text";
      componentId: string;
      x: number;
      y: number;
      lastX: number;
      lastY: number;
      pointerId: number;
      parentWidth: number;
      parentHeight: number;
    };

type ResizeHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const CLICK_DRAG_THRESHOLD_PX = 6;

const isPanelComponent = (component: PageComponent): component is PanelComponent =>
  component.type === "panel";

const canUseAsWorkingPanel = (component: PageComponent | null | undefined): component is PanelComponent =>
  Boolean(component && component.type === "panel" && component.kind !== "stage");

const getPanelKindLabel = (kind: PanelComponent["kind"]) => {
  switch (kind) {
    case "container":
      return "主界面";
    case "surface":
      return "界面区域";
    case "stage":
      return "关卡界面";
    case "group":
      return "子面板";
    case "overlay":
      return "弹出面板";
    default:
      return "面板";
  }
};

const getComponentLabel = (component: PageComponent) => {
  switch (component.type) {
    case "button":
      return component.label;
    case "panel":
      return component.title ?? getPanelKindLabel(component.kind);
    case "text":
      return component.text.trim() || "文本框";
    case "list":
      return component.emptyStateText ?? component.dataPath;
    case "widget":
      return component.widgetId === "adminProposalReview"
        ? "提案审核"
        : component.widgetId === "levelMapStage"
          ? "关卡路径地图"
          : component.widgetId;
  }
};

const getComponentTypeLabel = (component: PageComponent) => {
  switch (component.type) {
    case "button":
      return "按钮";
    case "panel":
      return "面板";
    case "text":
      return "文本框";
    case "list":
      return "列表";
    case "widget":
      return "功能组件";
  }
};

const createComponentMap = (components: PageComponent[]) =>
  new Map(components.map((component) => [component.id, component]));

const getParentPanelId = (pageConfig: PageConfig, componentId: string) =>
  pageConfig.components.find(
    (component) => component.type === "panel" && component.childComponentIds.includes(componentId),
  )?.id ?? null;

const getButtonControlledPanelId = (component: PageComponent) =>
  component.type === "button" && component.action.type === "openPanel" ? component.action.panelId : null;

const isControlledPanel = (component: PageComponent): component is PanelComponent =>
  component.type === "panel"
  && (
    component.kind === "overlay"
    || component.panelRole === "popover"
    || component.panelRole === "workflowPanel"
  );

const createControlledPanelIds = (components: PageComponent[]) => {
  const controlledPanelIds = new Set<string>();
  components.forEach((component) => {
    if (isControlledPanel(component)) {
      controlledPanelIds.add(component.id);
    }
    const panelId = getButtonControlledPanelId(component);
    if (panelId) {
      controlledPanelIds.add(panelId);
    }
  });
  return controlledPanelIds;
};

const getLogicalPanelChildren = (
  panel: PanelComponent,
  componentMap: Map<string, PageComponent>,
  controlledPanelIds: Set<string>,
) =>
  panel.childComponentIds
    .map((childId) => componentMap.get(childId))
    .filter((child): child is PageComponent => Boolean(child))
    .filter((child) => !(child.type === "panel" && controlledPanelIds.has(child.id)));

const getControlledPanelForButton = (
  component: PageComponent,
  componentMap: Map<string, PageComponent>,
): PanelComponent | null => {
  const panelId = getButtonControlledPanelId(component);
  const panel = panelId ? componentMap.get(panelId) : null;
  return panel && isPanelComponent(panel) ? panel : null;
};

const getPanelControlledChildren = (
  panel: PanelComponent,
  componentMap: Map<string, PageComponent>,
) =>
  [
    ...panel.childComponentIds
      .map((childId) => componentMap.get(childId))
      .filter((child): child is PageComponent => Boolean(child))
      .filter(isControlledPanel),
    ...panel.childComponentIds
      .map((childId) => componentMap.get(childId))
      .map((child) => child ? getControlledPanelForButton(child, componentMap) : null)
      .filter((child): child is PanelComponent => Boolean(child)),
  ];

const getAllChildPanels = (
  panel: PanelComponent,
  componentMap: Map<string, PageComponent>,
) =>
  panel.childComponentIds
    .map((childId) => componentMap.get(childId))
    .filter((child): child is PanelComponent => Boolean(child && child.type === "panel"));

const createChildComponentId = (pageConfig: PageConfig, parentPanel: PanelComponent) => {
  const existingIds = new Set(pageConfig.components.map((component) => component.id));
  let index = parentPanel.childComponentIds.length + 1;
  let candidate = `${parentPanel.id}.${index}`;

  while (existingIds.has(candidate)) {
    index += 1;
    candidate = `${parentPanel.id}.${index}`;
  }

  return candidate;
};

const createDefaultComponentName = (
  pageConfig: PageConfig,
  parentPanel: PanelComponent,
  type: "button" | "panel" | "text",
) => {
  const componentMap = createComponentMap(pageConfig.components);
  const siblingCount = parentPanel.childComponentIds
    .map((childId) => componentMap.get(childId))
    .filter((component): component is PageComponent => Boolean(component))
    .filter((component) => component.type === type)
    .length;
  const order = siblingCount + 1;

  if (type === "button") {
    return `新按钮 ${order}`;
  }
  if (type === "panel") {
    return `新子面板 ${order}`;
  }
  return `新文本框 ${order}`;
};

const handleInlineScrollWheel = (event: WheelEvent<HTMLElement>) => {
  event.stopPropagation();
  event.preventDefault();

  if (event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) {
    return;
  }

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  event.currentTarget.scrollLeft += delta;
};

const escapeSelectorValue = (value: string) =>
  typeof CSS !== "undefined" && CSS.escape
    ? CSS.escape(value)
    : value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

const hitTestOutlinedComponent = (
  root: HTMLElement,
  point: { x: number; y: number },
  outlinedComponentIds: Set<string>,
) => {
  const candidates = [...outlinedComponentIds]
    .map((componentId) =>
      root.querySelector<HTMLElement>(`[data-page-builder-outline-id="${escapeSelectorValue(componentId)}"]`),
    )
    .filter((element): element is HTMLElement => Boolean(element))
    .map((element, index) => {
      const rect = element.getBoundingClientRect();
      const host = element.parentElement;
      const zIndex = host ? Number.parseInt(window.getComputedStyle(host).zIndex, 10) : 0;
      return {
        componentId: element.dataset.pageBuilderOutlineId ?? "",
        index,
        zIndex: Number.isNaN(zIndex) ? 0 : zIndex,
        rect,
      };
    })
    .filter(({ componentId, rect }) =>
      componentId &&
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom,
    )
    .sort((left, right) => left.zIndex - right.zIndex || left.index - right.index);

  return candidates.at(-1)?.componentId ?? null;
};

const getSelectedMoveTarget = (
  root: HTMLElement,
  point: { x: number; y: number },
  selectedComponentId: string | null,
) => {
  if (!selectedComponentId) {
    return null;
  }

  const outline = root.querySelector<HTMLElement>(
    `[data-page-builder-outline-id="${escapeSelectorValue(selectedComponentId)}"]`,
  );
  if (!outline) {
    return null;
  }

  const rect = outline.getBoundingClientRect();
  if (point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom) {
    return null;
  }

  const parentCanvas = outline
    .closest<HTMLElement>(".page-builder-preview-panel-canvas, .page-builder-preview-page");
  const parentRect = parentCanvas?.getBoundingClientRect();
  if (!parentRect) {
    return null;
  }

  return {
    componentId: selectedComponentId,
    parentWidth: parentRect.width,
    parentHeight: parentRect.height,
  };
};

const getSelectedResizeTarget = (
  root: HTMLElement,
  point: { x: number; y: number },
  selectedComponentId: string | null,
) => {
  if (!selectedComponentId) {
    return null;
  }

  const handleElements = [...root.querySelectorAll<HTMLElement>("[data-page-builder-resize-handle]")];
  const matchedHandle = handleElements.find((handleElement) => {
    const outline = handleElement.closest<HTMLElement>("[data-page-builder-outline-id]");
    if (outline?.dataset.pageBuilderOutlineId !== selectedComponentId) {
      return false;
    }
    const rect = handleElement.getBoundingClientRect();
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
  });

  const handle = matchedHandle?.dataset.pageBuilderResizeHandle as ResizeHandle | undefined;
  if (!matchedHandle || !handle) {
    return null;
  }

  const parentCanvas = matchedHandle
    .closest<HTMLElement>(".page-builder-preview-panel-canvas, .page-builder-preview-page");
  const parentRect = parentCanvas?.getBoundingClientRect();
  if (!parentRect) {
    return null;
  }

  return {
    componentId: selectedComponentId,
    handle,
    parentWidth: parentRect.width,
    parentHeight: parentRect.height,
  };
};

const useDragScroll = (enabled: boolean) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled || event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('[data-page-builder-selected="true"]')) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: container.scrollLeft,
      startScrollTop: container.scrollTop,
    };
    container.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container || !dragStateRef.current.active) {
      return;
    }

    container.scrollLeft = dragStateRef.current.startScrollLeft - (event.clientX - dragStateRef.current.startX);
    container.scrollTop = dragStateRef.current.startScrollTop - (event.clientY - dragStateRef.current.startY);
  };

  const stopDragScroll = (event: PointerEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    dragStateRef.current.active = false;
    if (container?.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
  };

  return {
    scrollContainerRef,
    dragScrollHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: stopDragScroll,
      onPointerCancel: stopDragScroll,
      onPointerLeave: stopDragScroll,
    },
  };
};

type PageBuilderComponentNodeProps = {
  component: PageComponent;
  componentMap: Map<string, PageComponent>;
  controlledPanelIds: Set<string>;
  openPanelIds: Set<string>;
  previewUser: ReturnType<typeof getUiPreviewUser>;
  outlinedComponentIds: Set<string>;
  pendingComponentId: string | null;
  selectedComponentId: string | null;
  editingTextComponentId: string | null;
  onTogglePanel: (panelId: string) => void;
  onResizeSelectedComponent: (
    componentId: string,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
    parentWidth: number,
    parentHeight: number,
  ) => void;
  onTextChange: (componentId: string, text: string) => void;
  onTextEditEnd: () => void;
  visitedComponentIds?: Set<string>;
};

const PageBuilderOutline = ({
  componentId,
  selectionState,
}: {
  componentId: string;
  selectionState: OutlineSelectionState;
}) => (
  <div
    className={`page-builder-node-outline state-${selectionState}`}
    data-page-builder-outline-id={componentId}
    contentEditable={false}
    aria-hidden="true"
  >
    <span className="page-builder-corner top-left" data-page-builder-resize-handle="top-left" />
    <span className="page-builder-corner top-right" data-page-builder-resize-handle="top-right" />
    <span className="page-builder-corner bottom-left" data-page-builder-resize-handle="bottom-left" />
    <span className="page-builder-corner bottom-right" data-page-builder-resize-handle="bottom-right" />
  </div>
);

type PageBuilderTextNodeProps = {
  component: Extract<PageComponent, { type: "text" }>;
  previewUser: ReturnType<typeof getUiPreviewUser>;
  showOutline: boolean;
  selectionState: OutlineSelectionState;
  isSelected: boolean;
  isEditing: boolean;
  onTextChange: (componentId: string, text: string) => void;
  onTextEditEnd: () => void;
};

const PageBuilderTextNode = ({
  component,
  previewUser,
  showOutline,
  selectionState,
  isSelected,
  isEditing,
  onTextChange,
  onTextEditEnd,
}: PageBuilderTextNodeProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const wasEditingRef = useRef(false);
  const artTextDesign = component.artTextDesign;
  const usesArtText = isArtTextPreset(resolveTextArtDesign(artTextDesign).preset);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (isEditing && !wasEditingRef.current) {
      editor.textContent = component.text;
      window.requestAnimationFrame(() => {
        editor.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      });
    }

    if (!isEditing && wasEditingRef.current) {
      onTextChange(component.id, editor.textContent ?? "");
    }

    wasEditingRef.current = isEditing;
  }, [component.id, component.text, isEditing, onTextChange]);

  return (
    <div
      className={`page-builder-preview-node page-builder-preview-text ${isEditing ? "editing" : ""} ${usesArtText ? "is-art-text" : ""}`.trim()}
      data-page-builder-component-id={component.id}
      data-page-builder-selected={isSelected ? "true" : undefined}
      style={{
        ...getPositionStyle(component.position),
        ...getComponentStyle(component.style),
        ...(usesArtText ? getPanelTextArtContainerStyle(artTextDesign) : {}),
      }}
    >
      <div
        ref={editorRef}
        className={`page-builder-preview-text-content ${usesArtText && !isEditing ? getPanelTextArtContentClassName(artTextDesign) : ""}`.trim()}
        data-page-builder-text-editing={isEditing ? "true" : undefined}
        contentEditable={isEditing}
        suppressContentEditableWarning={isEditing}
        style={usesArtText && !isEditing ? getPanelTextArtContentStyle(artTextDesign) : undefined}
        onBlur={(event) => {
          if (isEditing) {
            onTextChange(component.id, event.currentTarget.textContent ?? "");
            onTextEditEnd();
          }
        }}
      >
        {isEditing ? null : resolveTextComponentContent(component, previewUser)}
      </div>
      {showOutline ? <PageBuilderOutline componentId={component.id} selectionState={selectionState} /> : null}
    </div>
  );
};

const PageBuilderComponentNode = ({
  component,
  componentMap,
  controlledPanelIds,
  openPanelIds,
  previewUser,
  outlinedComponentIds,
  pendingComponentId,
  selectedComponentId,
  editingTextComponentId,
  onTogglePanel,
  onResizeSelectedComponent,
  onTextChange,
  onTextEditEnd,
  visitedComponentIds = new Set<string>(),
}: PageBuilderComponentNodeProps) => {
  if (visitedComponentIds.has(component.id)) {
    return null;
  }

  const nextVisitedComponentIds = new Set(visitedComponentIds);
  nextVisitedComponentIds.add(component.id);
  const showOutline = outlinedComponentIds.has(component.id);
  const isSelected = component.id === selectedComponentId;
  const selectionState: OutlineSelectionState =
    isSelected
      ? "selected"
      : component.id === pendingComponentId
        ? "pending"
        : "idle";

  if (component.type === "button") {
    const controlledPanelId = getButtonControlledPanelId(component);
    const isActivePanelTrigger = Boolean(controlledPanelId && openPanelIds.has(controlledPanelId));
    const shouldShowContent = !component.imageDesign?.outputDataUrl;

    return (
      <button
        type="button"
        className={`page-builder-preview-node page-builder-preview-button ${component.style?.variant ?? "primary"} ${isActivePanelTrigger ? "active-panel-trigger" : ""}`}
        data-page-builder-component-id={component.id}
        data-page-builder-selected={isSelected ? "true" : undefined}
        style={{
          ...getPositionStyle(component.position),
          ...getComponentStyle(component.style),
          ...getButtonTextScaleStyle(component.position, component.style),
          ...(component.baseDesign ? { backgroundColor: "#ffffff", borderColor: "transparent", borderRadius: 0, padding: 0 } : {}),
        }}
        tabIndex={-1}
        onClick={() => {
          if (isSelected) {
            return;
          }
          if (controlledPanelId) {
            onTogglePanel(controlledPanelId);
          }
        }}
      >
        {component.baseDesign ? (
          <span
            className="dynamic-ui-button-base"
            style={getButtonBaseDesignStyle(component.baseDesign)}
            aria-hidden="true"
          >
            {component.baseDesign.scalingMode === "fixedAspect" ? <img src={component.baseDesign.sourceDataUrl} alt="" /> : null}
          </span>
        ) : null}
        {component.imageDesign ? (
          <span
            className="dynamic-ui-button-image"
            style={getButtonImageDesignStyle(component.imageDesign)}
            aria-hidden="true"
          />
        ) : null}
        {shouldShowContent ? (
          <span className="dynamic-ui-button-content">
            {component.icon ? <span className="dynamic-ui-button-icon">{component.icon}</span> : null}
            <span>{component.label}</span>
          </span>
        ) : null}
        {showOutline ? <PageBuilderOutline componentId={component.id} selectionState={selectionState} /> : null}
      </button>
    );
  }

  if (component.type === "text") {
    const isEditing = component.id === editingTextComponentId;
    return (
      <PageBuilderTextNode
        component={component}
        previewUser={previewUser}
        showOutline={showOutline}
        selectionState={selectionState}
        isSelected={isSelected}
        isEditing={isEditing}
        onTextChange={onTextChange}
        onTextEditEnd={onTextEditEnd}
      />
    );
  }

  if (component.type === "list") {
    return (
      <div
        className="page-builder-preview-node page-builder-preview-text"
        data-page-builder-component-id={component.id}
        data-page-builder-selected={isSelected ? "true" : undefined}
        style={{
          ...getPositionStyle(component.position),
          ...getComponentStyle(component.style),
        }}
      >
        <div className="page-builder-preview-text-content">
          {component.emptyStateText ?? `列表：${component.dataPath}`}
        </div>
        {showOutline ? <PageBuilderOutline componentId={component.id} selectionState={selectionState} /> : null}
      </div>
    );
  }

  if (component.type === "widget") {
    return (
      <div
        className="page-builder-preview-node page-builder-preview-text"
        data-page-builder-component-id={component.id}
        data-page-builder-selected={isSelected ? "true" : undefined}
        style={{
          ...getPositionStyle(component.position),
          ...getComponentStyle(component.style),
        }}
      >
        <div className="page-builder-preview-text-content">
          {component.widgetId === "adminProposalReview"
            ? "提案审核功能组件"
            : component.widgetId === "levelMapStage"
              ? "关卡路径地图组件"
              : component.widgetId}
        </div>
        {showOutline ? <PageBuilderOutline componentId={component.id} selectionState={selectionState} /> : null}
      </div>
    );
  }

  if (component.type !== "panel") {
    return null;
  }

  const contentSize = component.contentSize;
  const { scrollContainerRef, dragScrollHandlers } = useDragScroll(Boolean(contentSize));
  const childComponents = [
    ...getLogicalPanelChildren(component, componentMap, controlledPanelIds),
    ...getPanelControlledChildren(component, componentMap).filter((child) => openPanelIds.has(child.id)),
  ];

  return (
    <section
      className={`page-builder-preview-node page-builder-preview-panel kind-${component.kind ?? "container"} ${controlledPanelIds.has(component.id) ? "controlled-panel" : ""}`}
      data-page-builder-component-id={component.id}
      data-page-builder-selected={isSelected ? "true" : undefined}
      style={{
        ...getPositionStyle(component.position),
        ...getComponentStyle(component.style),
      }}
    >
      {showOutline ? <PageBuilderOutline componentId={component.id} selectionState={selectionState} /> : null}
      <div
        ref={scrollContainerRef}
        className={`page-builder-preview-panel-content ${contentSize ? "scrollable draggable" : ""}`}
        {...dragScrollHandlers}
      >
        <div
          className="page-builder-preview-panel-canvas"
          style={
            contentSize
              ? {
                  width: `${contentSize.widthPercent}%`,
                  height: `${contentSize.heightPercent}%`,
                }
              : undefined
          }
        >
          {childComponents.map((child) => (
            <PageBuilderComponentNode
              key={child.id}
              component={child}
              componentMap={componentMap}
              controlledPanelIds={controlledPanelIds}
              openPanelIds={openPanelIds}
              previewUser={previewUser}
              outlinedComponentIds={outlinedComponentIds}
              pendingComponentId={pendingComponentId}
              selectedComponentId={selectedComponentId}
              editingTextComponentId={editingTextComponentId}
              onTogglePanel={onTogglePanel}
              onResizeSelectedComponent={onResizeSelectedComponent}
              onTextChange={onTextChange}
              onTextEditEnd={onTextEditEnd}
              visitedComponentIds={nextVisitedComponentIds}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

type PageBuilderPreviewProps = {
  pageConfig: PageConfig;
  controlledPanelIds: Set<string>;
  openPanelIds: Set<string>;
  previewUser: ReturnType<typeof getUiPreviewUser>;
  outlinedComponentIds: Set<string>;
  pendingComponentId: string | null;
  selectedComponentId: string | null;
  editingTextComponentId: string | null;
  onTogglePanel: (panelId: string) => void;
  onOutlineClick: (componentId: string) => void;
  onOutlineMiss: () => void;
  onStartTextEditing: (componentId: string) => void;
  onMoveSelectedComponent: (
    componentId: string,
    deltaX: number,
    deltaY: number,
    parentWidth: number,
    parentHeight: number,
  ) => void;
  onResizeSelectedComponent: (
    componentId: string,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
    parentWidth: number,
    parentHeight: number,
  ) => void;
  onTextChange: (componentId: string, text: string) => void;
  onTextEditEnd: () => void;
};

const PageBuilderPreview = ({
  pageConfig,
  controlledPanelIds,
  openPanelIds,
  previewUser,
  outlinedComponentIds,
  pendingComponentId,
  selectedComponentId,
  editingTextComponentId,
  onTogglePanel,
  onOutlineClick,
  onOutlineMiss,
  onStartTextEditing,
  onMoveSelectedComponent,
  onResizeSelectedComponent,
  onTextChange,
  onTextEditEnd,
}: PageBuilderPreviewProps) => {
  const pointerStartRef = useRef<PointerGestureState | null>(null);
  const componentMap = useMemo(() => createComponentMap(pageConfig.components), [pageConfig.components]);
  const rootComponents = useMemo(
    () => getRootComponents(pageConfig.components),
    [pageConfig.components],
  );

  const handlePreviewPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('[data-page-builder-text-editing="true"]')) {
      pointerStartRef.current = null;
      return;
    }

    const selectedResizeTarget = getSelectedResizeTarget(
      event.currentTarget,
      { x: event.clientX, y: event.clientY },
      selectedComponentId,
    );
    if (selectedResizeTarget) {
      pointerStartRef.current = {
        mode: "resize-selected",
        componentId: selectedResizeTarget.componentId,
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

    const selectedMoveTarget = getSelectedMoveTarget(
      event.currentTarget,
      { x: event.clientX, y: event.clientY },
      selectedComponentId,
    );
    if (selectedMoveTarget) {
      const selectedComponent = componentMap.get(selectedMoveTarget.componentId);
      pointerStartRef.current = {
        mode: selectedComponent?.type === "text" ? "selected-text" : "move-selected",
        componentId: selectedMoveTarget.componentId,
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

    pointerStartRef.current = {
      mode: "click",
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
  };

  const handlePreviewPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointerStart = pointerStartRef.current;
    if (
      !pointerStart ||
      (pointerStart.mode !== "move-selected" &&
        pointerStart.mode !== "resize-selected" &&
        pointerStart.mode !== "selected-text") ||
      pointerStart.pointerId !== event.pointerId
    ) {
      return;
    }

    const deltaX = event.clientX - pointerStart.lastX;
    const deltaY = event.clientY - pointerStart.lastY;
    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    if (pointerStart.mode === "selected-text") {
      const totalDistance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
      if (totalDistance <= CLICK_DRAG_THRESHOLD_PX) {
        return;
      }

      onMoveSelectedComponent(
        pointerStart.componentId,
        event.clientX - pointerStart.x,
        event.clientY - pointerStart.y,
        pointerStart.parentWidth,
        pointerStart.parentHeight,
      );
      pointerStartRef.current = {
        ...pointerStart,
        mode: "move-selected",
        lastX: event.clientX,
        lastY: event.clientY,
      };
      return;
    }

    if (pointerStart.mode === "move-selected") {
      onMoveSelectedComponent(
        pointerStart.componentId,
        deltaX,
        deltaY,
        pointerStart.parentWidth,
        pointerStart.parentHeight,
      );
    } else {
      onResizeSelectedComponent(
        pointerStart.componentId,
        pointerStart.handle,
        deltaX,
        deltaY,
        pointerStart.parentWidth,
        pointerStart.parentHeight,
      );
    }
    pointerStartRef.current = {
      ...pointerStart,
      lastX: event.clientX,
      lastY: event.clientY,
    };
  };

  const handlePreviewPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const pointerStart = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!pointerStart || pointerStart.pointerId !== event.pointerId) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (pointerStart.mode === "move-selected" || pointerStart.mode === "resize-selected") {
      return;
    }

    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    const dragDistance = Math.hypot(deltaX, deltaY);
    if (dragDistance > CLICK_DRAG_THRESHOLD_PX) {
      return;
    }
    if (pointerStart.mode === "selected-text") {
      onStartTextEditing(pointerStart.componentId);
      return;
    }

    const hitComponentId = hitTestOutlinedComponent(
      event.currentTarget,
      { x: event.clientX, y: event.clientY },
      outlinedComponentIds,
    );
    if (hitComponentId) {
      onOutlineClick(hitComponentId);
    } else {
      onOutlineMiss();
    }
  };

  return (
    <div
      className={`page-builder-preview-page layout-${pageConfig.layout.type}`}
      onPointerDown={handlePreviewPointerDown}
      onPointerMove={handlePreviewPointerMove}
      onPointerUp={handlePreviewPointerUp}
      onPointerCancel={() => {
        pointerStartRef.current = null;
      }}
    >
      {rootComponents.map((component) => (
        <PageBuilderComponentNode
          key={component.id}
          component={component}
          componentMap={componentMap}
          controlledPanelIds={controlledPanelIds}
          openPanelIds={openPanelIds}
          previewUser={previewUser}
          outlinedComponentIds={outlinedComponentIds}
          pendingComponentId={pendingComponentId}
          selectedComponentId={selectedComponentId}
          editingTextComponentId={editingTextComponentId}
          onTogglePanel={onTogglePanel}
          onResizeSelectedComponent={onResizeSelectedComponent}
          onTextChange={onTextChange}
          onTextEditEnd={onTextEditEnd}
        />
      ))}
    </div>
  );
};

export const DirectorPageBuilderPage = ({ pageId, targetPath = "/", onBack, onNavigate }: DirectorPageBuilderPageProps) => {
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(() => pageId ? getPageConfig(pageId) : null);
  const [panelPickerOpen, setPanelPickerOpen] = useState(false);
  const [pickerPanelId, setPickerPanelId] = useState<string | null>(null);
  const [showPanelOutlines, setShowPanelOutlines] = useState(true);
  const [showButtonOutlines, setShowButtonOutlines] = useState(true);
  const [showTextOutlines, setShowTextOutlines] = useState(true);
  const [openPanelIds, setOpenPanelIds] = useState<Set<string>>(() => new Set());
  const [pendingComponentId, setPendingComponentId] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [editingTextComponentId, setEditingTextComponentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [builderSurfaceMode, setBuilderSurfaceMode] = useState<"editor" | "static" | "dynamic" | "compare">("editor");
  const previewUser = pageConfig ? getUiPreviewUser(pageConfig.roleScope) : null;
  const componentMap = useMemo(
    () => pageConfig ? createComponentMap(pageConfig.components) : new Map<string, PageComponent>(),
    [pageConfig],
  );
  const controlledPanelIds = useMemo(
    () => pageConfig ? createControlledPanelIds(pageConfig.components) : new Set<string>(),
    [pageConfig],
  );
  const rootPanel = useMemo(
    () => pageConfig?.components.find(canUseAsWorkingPanel) ?? null,
    [pageConfig],
  );
  const [workingPanelId, setWorkingPanelId] = useState<string | null>(() =>
    pageConfig?.components.find(canUseAsWorkingPanel)?.id ?? null,
  );
  const workingPanel = workingPanelId ? componentMap.get(workingPanelId) : rootPanel;
  const normalizedWorkingPanel = workingPanel && canUseAsWorkingPanel(workingPanel) ? workingPanel : rootPanel;
  const activePickerPanel = pickerPanelId
    ? componentMap.get(pickerPanelId)
    : normalizedWorkingPanel;
  const normalizedPickerPanel = activePickerPanel && isPanelComponent(activePickerPanel)
    ? activePickerPanel
    : normalizedWorkingPanel;
  const outlinedComponentIds = useMemo(() => {
    if (!normalizedWorkingPanel) {
      return new Set<string>();
    }

    const nextOutlinedComponentIds = new Set<string>();
    getLogicalPanelChildren(normalizedWorkingPanel, componentMap, controlledPanelIds).forEach((child) => {
      if (child.type === "panel" && showPanelOutlines) {
        nextOutlinedComponentIds.add(child.id);
      }
      if (child.type === "button" && showButtonOutlines) {
        nextOutlinedComponentIds.add(child.id);
      }
      if (child.type === "text" && showTextOutlines) {
        nextOutlinedComponentIds.add(child.id);
      }
    });
    return nextOutlinedComponentIds;
  }, [componentMap, controlledPanelIds, normalizedWorkingPanel, showButtonOutlines, showPanelOutlines, showTextOutlines]);
  const normalizedPendingComponentId =
    pendingComponentId && outlinedComponentIds.has(pendingComponentId) ? pendingComponentId : null;
  const normalizedSelectedComponentId =
    selectedComponentId && outlinedComponentIds.has(selectedComponentId) ? selectedComponentId : null;
  const selectedComponent = normalizedSelectedComponentId
    ? componentMap.get(normalizedSelectedComponentId) ?? null
    : null;
  const activeComponent = selectedComponent
    ?? (normalizedPendingComponentId ? componentMap.get(normalizedPendingComponentId) ?? null : null);
  const updatePageConfig = (updater: (current: PageConfig) => PageConfig) => {
    setPageConfig((current) => current ? updater(current) : current);
    setFeedback("");
  };

  const addComponentToWorkingPanel = (type: "button" | "panel" | "text") => {
    if (!normalizedWorkingPanel) {
      return;
    }

    updatePageConfig((current) => {
      const currentWorkingPanel = current.components.find(
        (component): component is PanelComponent =>
          component.id === normalizedWorkingPanel.id && canUseAsWorkingPanel(component),
      );
      if (!currentWorkingPanel) {
        return current;
      }

      const componentId = createChildComponentId(current, currentWorkingPanel);
      const defaultName = createDefaultComponentName(current, currentWorkingPanel, type);
      const newComponent: PageComponent =
        type === "button"
          ? {
              id: componentId,
              type: "button",
              label: defaultName,
              icon: "plus",
              position: { unit: "percent", x: 8, y: 8, width: 18, height: 8 },
              style: { variant: "secondary", borderRadius: 10 },
              action: { type: "none" },
            }
          : type === "panel"
            ? {
                id: componentId,
                type: "panel",
                kind: "group",
                title: defaultName,
                position: { unit: "percent", x: 10, y: 12, width: 34, height: 26 },
                style: { backgroundColor: "#fffdfa", borderRadius: 12 },
                childComponentIds: [],
              }
            : {
                id: componentId,
                type: "text",
                text: defaultName,
                textContentMode: "fixed",
                artTextDesign: { preset: "goldGradient" },
                position: { unit: "percent", x: 8, y: 8, width: 28, height: 8 },
                style: { backgroundColor: "#ffffff", textColor: "#12202f", borderRadius: 10 },
              };

      return {
        ...current,
        components: current.components
          .map((component) =>
            component.id === currentWorkingPanel.id && component.type === "panel"
              ? {
                  ...component,
                  childComponentIds: [...component.childComponentIds, componentId],
                }
              : component,
          )
          .concat(newComponent),
      };
    });
  };

  const deleteWorkingPanel = () => {
    if (!pageConfig || !normalizedWorkingPanel || normalizedWorkingPanel.id === rootPanel?.id) {
      return;
    }

    const removedIds = new Set<string>();
    const collectDescendants = (componentId: string) => {
      removedIds.add(componentId);
      const component = componentMap.get(componentId);
      if (component?.type === "panel") {
        component.childComponentIds.forEach(collectDescendants);
      }
    };
    collectDescendants(normalizedWorkingPanel.id);
    const parentPanelId = getParentPanelId(pageConfig, normalizedWorkingPanel.id);

    updatePageConfig((current) => ({
      ...current,
      components: current.components
        .filter((component) => !removedIds.has(component.id))
        .map((component) =>
          component.type === "panel"
            ? {
                ...component,
                childComponentIds: component.childComponentIds.filter((childId) => !removedIds.has(childId)),
              }
            : component,
        ),
    }));
    setWorkingPanelId(parentPanelId ?? rootPanel?.id ?? null);
    setPickerPanelId(parentPanelId ?? rootPanel?.id ?? null);
  };

  const handleSave = () => {
    if (!pageConfig) {
      return;
    }

    savePageConfig(pageConfig);
    setFeedback("配置已保存到本地。");
  };
  const openButtonDesign = () => {
    if (!pageId || activeComponent?.type !== "button") {
      return;
    }

    const designBasePath = targetPath === "/" ? "" : targetPath;
    onNavigate(
      `${designBasePath}/button_design?pageId=${encodeURIComponent(pageId)}&componentId=${encodeURIComponent(activeComponent.id)}`,
    );
  };
  const openButtonConfig = () => {
    if (!pageId || activeComponent?.type !== "button") {
      return;
    }

    const designBasePath = targetPath === "/" ? "" : targetPath;
    onNavigate(
      `${designBasePath}/button_config?pageId=${encodeURIComponent(pageId)}&componentId=${encodeURIComponent(activeComponent.id)}`,
    );
  };
  const openPanelCreate = () => {
    if (!pageId) {
      return;
    }

    const designBasePath = targetPath === "/" ? "" : targetPath;
    const parentPanelQuery = normalizedWorkingPanel
      ? `&parentPanelId=${encodeURIComponent(normalizedWorkingPanel.id)}`
      : "";
    onNavigate(
      `${designBasePath}/panel_create?pageId=${encodeURIComponent(pageId)}${parentPanelQuery}`,
    );
  };
  const setActivePanelAsWorkingPanel = () => {
    if (!canUseAsWorkingPanel(activeComponent)) {
      return;
    }

    setWorkingPanelId(activeComponent.id);
    setPickerPanelId(activeComponent.id);
    setPendingComponentId(null);
    setSelectedComponentId(null);
    setEditingTextComponentId(null);
  };
  const togglePreviewPanel = (panelId: string) => {
    setOpenPanelIds((current) => {
      const next = new Set(current);
      if (next.has(panelId)) {
        next.delete(panelId);
      } else {
        next.add(panelId);
      }
      return next;
    });
  };
  const selectPreviewObject = (componentId: string) => {
    if (!outlinedComponentIds.has(componentId)) {
      return;
    }

    setEditingTextComponentId(null);
    if (normalizedPendingComponentId === componentId) {
      setSelectedComponentId(componentId);
      setPendingComponentId(null);
      return;
    }

    if (normalizedSelectedComponentId === componentId) {
      return;
    }

    setPendingComponentId(componentId);
    setSelectedComponentId(null);
  };
  const clearPreviewObjectSelection = () => {
    setPendingComponentId(null);
    setSelectedComponentId(null);
    setEditingTextComponentId(null);
  };
  const startTextEditing = (componentId: string) => {
    const component = componentMap.get(componentId);
    if (
      component?.type !== "text"
      || normalizedSelectedComponentId !== componentId
      || getTextContentMode(component.textContentMode) === "dynamic"
    ) {
      return;
    }

    setEditingTextComponentId(componentId);
  };
  const updateTextComponent = (componentId: string, updater: (component: TextComponent) => TextComponent) => {
    updatePageConfig((current) => ({
      ...current,
      components: current.components.map((component) =>
        component.id === componentId && component.type === "text"
          ? updater(component)
          : component,
      ),
    }));
  };
  const updateTextComponentContent = (componentId: string, text: string) => {
    updateTextComponent(componentId, (component) => ({ ...component, text }));
  };
  const endTextEditing = () => {
    setEditingTextComponentId(null);
  };
  const moveSelectedPreviewObject = (
    componentId: string,
    deltaX: number,
    deltaY: number,
    parentWidth: number,
    parentHeight: number,
  ) => {
    if (!normalizedSelectedComponentId || normalizedSelectedComponentId !== componentId) {
      return;
    }
    setEditingTextComponentId(null);

    updatePageConfig((current) => ({
      ...current,
      components: current.components.map((component) => {
        if (component.id !== componentId) {
          return component;
        }

        const nextX = component.position.unit === "px"
          ? component.position.x + deltaX
          : component.position.x + (deltaX / parentWidth) * 100;
        const nextY = component.position.unit === "px"
          ? component.position.y + deltaY
          : component.position.y + (deltaY / parentHeight) * 100;

        return {
          ...component,
          position: {
            ...component.position,
            x: Math.max(0, nextX),
            y: Math.max(0, nextY),
          },
        };
      }),
    }));
  };
  const resizeSelectedPreviewObject = (
    componentId: string,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
    parentWidth: number,
    parentHeight: number,
  ) => {
    if (!normalizedSelectedComponentId || normalizedSelectedComponentId !== componentId) {
      return;
    }
    setEditingTextComponentId(null);

    updatePageConfig((current) => ({
      ...current,
      components: current.components.map((component) => {
        if (component.id !== componentId) {
          return component;
        }

        const position = component.position;
        const deltaUnitX = position.unit === "px" ? deltaX : (deltaX / parentWidth) * 100;
        const deltaUnitY = position.unit === "px" ? deltaY : (deltaY / parentHeight) * 100;
        const minWidth = position.unit === "px" ? 24 : 2;
        const minHeight = position.unit === "px" ? 18 : 2;
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

        const lockedAspectRatio = component.type === "button" ? component.style?.lockAspectRatio : undefined;
        if (typeof lockedAspectRatio === "number") {
          if (Math.abs(deltaUnitX) >= Math.abs(deltaUnitY)) {
            const adjustedHeight = Math.max(minHeight, nextWidth / lockedAspectRatio);
            if (isTopHandle) {
              nextY = Math.max(0, position.y + position.height - adjustedHeight);
            }
            nextHeight = adjustedHeight;
          } else {
            const adjustedWidth = Math.max(minWidth, nextHeight * lockedAspectRatio);
            if (isLeftHandle) {
              nextX = Math.max(0, position.x + position.width - adjustedWidth);
            }
            nextWidth = adjustedWidth;
          }
        }

        return {
          ...component,
          position: {
            ...position,
            x: nextX,
            y: nextY,
            width: nextWidth,
            height: nextHeight,
          },
        };
      }),
    }));
  };

  return (
    <section className="page-builder-shell">
      <div className="page-builder-toolbar">
        <div>
          <p className="eyebrow">Page Builder</p>
          <h2>页面可视化编辑器</h2>
          <p className="panel-copy">可在编辑画布、静态页面、动态嵌套与并排对比之间切换，检查 UI 差异。</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={onBack}>
            返回 UI 美化配置
          </button>
          <button type="button" disabled={!pageConfig} onClick={handleSave}>
            保存配置
          </button>
        </div>
      </div>

      {!pageId ? (
        <p className="feedback error">缺少 pageId，无法进入页面优化。</p>
      ) : null}
      {pageId && !pageConfig ? (
        <p className="feedback error">该页面还没有动态页面配置，无法优化。</p>
      ) : null}

      {pageConfig ? (
        <div className="page-builder-layout">
          <div className="page-builder-preview-meta">
            <div>
              <span>预览页面</span>
              <strong>{pageConfig.name}</strong>
              <code>{pageConfig.path}</code>
            </div>
            {previewUser ? (
              <div>
                <span>测试账号</span>
                <strong>{previewUser.nickname}</strong>
                <code>
                  {previewUser.roleLabel} · {previewUser.apiUserId}
                </code>
              </div>
            ) : null}
          </div>
          <section className="page-builder-canvas-panel">
            <div className="page-builder-editor-actions">
              <span>配置工具</span>
              {feedback ? <span>{feedback}</span> : null}
            </div>
            <div className="page-builder-tool-strip">
              <section>
                <h3>工作面板</h3>
                <div className="page-builder-current-panel">
                  <span>请选择你所工作的面板</span>
                  <div>
                    <code>{normalizedWorkingPanel ? getComponentLabel(normalizedWorkingPanel) : "未选择"}</code>
                    <button type="button" className="secondary" onClick={() => {
                      setPickerPanelId(normalizedWorkingPanel?.id ?? rootPanel?.id ?? null);
                      setPanelPickerOpen(true);
                    }}>
                      修改
                    </button>
                  </div>
                </div>
              </section>

              <section>
                <h3>配置</h3>
                <label className="page-builder-check-row">
                  <input
                    type="checkbox"
                    checked={showPanelOutlines}
                    onChange={(event) => setShowPanelOutlines(event.target.checked)}
                  />
                  <span>显示所有子面板的轮廓</span>
                </label>
                <label className="page-builder-check-row">
                  <input
                    type="checkbox"
                    checked={showButtonOutlines}
                    onChange={(event) => setShowButtonOutlines(event.target.checked)}
                  />
                  <span>显示所有按钮的轮廓</span>
                </label>
                <label className="page-builder-check-row">
                  <input
                    type="checkbox"
                    checked={showTextOutlines}
                    onChange={(event) => setShowTextOutlines(event.target.checked)}
                  />
                  <span>显示所有文本框的轮廓</span>
                </label>
              </section>

              <section>
                <h3>基础操作</h3>
                <div className="page-builder-tool-buttons">
                  <button type="button" onClick={() => addComponentToWorkingPanel("button")}>
                    添加新按钮
                  </button>
                  <button type="button" onClick={() => addComponentToWorkingPanel("panel")}>
                    添加新子面板
                  </button>
                  <button type="button" className="secondary" onClick={openPanelCreate}>
                    创建小面板
                  </button>
                  <button type="button" onClick={() => addComponentToWorkingPanel("text")}>
                    新建文本框
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={!normalizedWorkingPanel || normalizedWorkingPanel.id === rootPanel?.id}
                    onClick={deleteWorkingPanel}
                  >
                    删除
                  </button>
                  {activeComponent?.type === "button" ? (
                    <button type="button" className="page-builder-button-design-action" onClick={openButtonDesign}>
                      按钮美化
                    </button>
                  ) : null}
                  {activeComponent?.type === "button" ? (
                    <button type="button" className="secondary page-builder-button-config-action" onClick={openButtonConfig}>
                      按钮配置
                    </button>
                  ) : null}
                  {canUseAsWorkingPanel(activeComponent) && activeComponent.id !== normalizedWorkingPanel?.id ? (
                    <button
                      type="button"
                      className="secondary page-builder-set-working-panel-action"
                      onClick={setActivePanelAsWorkingPanel}
                    >
                      设为工作面板
                    </button>
                  ) : null}
                </div>
              </section>
            </div>
            <section className="page-builder-selected-object-panel">
              <div>
                <h3>选中对象</h3>
                {activeComponent ? (
                  <span>{getComponentTypeLabel(activeComponent)}</span>
                ) : (
                  <span>未选中</span>
                )}
              </div>
              <div className="page-builder-selected-object-grid">
                <label>
                  <span>名称</span>
                  <code onWheel={handleInlineScrollWheel}>{activeComponent ? getComponentLabel(activeComponent) : "-"}</code>
                </label>
                <label>
                  <span>类型</span>
                  <code onWheel={handleInlineScrollWheel}>{activeComponent ? getComponentTypeLabel(activeComponent) : "-"}</code>
                </label>
                <label>
                  <span>位置</span>
                  <code onWheel={handleInlineScrollWheel}>
                    {activeComponent
                      ? `${activeComponent.position.x.toFixed(2)}, ${activeComponent.position.y.toFixed(2)}`
                      : "-"}
                  </code>
                </label>
                <label>
                  <span>宽</span>
                  <code onWheel={handleInlineScrollWheel}>{activeComponent ? activeComponent.position.width.toFixed(2) : "-"}</code>
                </label>
                <label>
                  <span>高</span>
                  <code onWheel={handleInlineScrollWheel}>{activeComponent ? activeComponent.position.height.toFixed(2) : "-"}</code>
                </label>
              </div>
              {activeComponent?.type === "text" && previewUser ? (
                <PageBuilderTextObjectEditor
                  component={activeComponent}
                  pageRoleScope={pageConfig.roleScope}
                  previewUser={previewUser}
                  onChange={(nextComponent) => updateTextComponent(activeComponent.id, () => nextComponent)}
                />
              ) : null}
            </section>
            <div className="page-builder-render-surface page-builder-actual-preview-surface">
              <div className="page-builder-surface-toggle" role="tablist" aria-label="页面预览模式">
                {([
                  ["editor", "编辑画布"],
                  ["static", "静态页面"],
                  ["dynamic", "动态嵌套"],
                  ["compare", "并排对比"],
                ] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={builderSurfaceMode === mode}
                    className={builderSurfaceMode === mode ? "active" : "secondary"}
                    disabled={mode === "static" && pageConfig ? !isStaticPageSupported(pageConfig.id) : false}
                    onClick={() => setBuilderSurfaceMode(mode)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {builderSurfaceMode === "editor" && previewUser ? (
                <div className="page-builder-dynamic-page-frame">
                  <PageBuilderPreview
                    pageConfig={pageConfig}
                    controlledPanelIds={controlledPanelIds}
                    openPanelIds={openPanelIds}
                    previewUser={previewUser}
                    outlinedComponentIds={outlinedComponentIds}
                    pendingComponentId={normalizedPendingComponentId}
                    selectedComponentId={normalizedSelectedComponentId}
                    editingTextComponentId={editingTextComponentId}
                    onTogglePanel={togglePreviewPanel}
                    onOutlineClick={selectPreviewObject}
                    onOutlineMiss={clearPreviewObjectSelection}
                    onStartTextEditing={startTextEditing}
                    onMoveSelectedComponent={moveSelectedPreviewObject}
                    onResizeSelectedComponent={resizeSelectedPreviewObject}
                    onTextChange={updateTextComponentContent}
                    onTextEditEnd={endTextEditing}
                  />
                </div>
              ) : null}
              {builderSurfaceMode === "static" && previewUser ? (
                <UiActualPagePreview page={pageConfig} previewUser={previewUser} pathname={targetPath} onNavigate={onNavigate} />
              ) : null}
              {builderSurfaceMode === "dynamic" && previewUser ? (
                <div className="page-builder-dynamic-page-frame">
                  <DynamicPageRenderer page={pageConfig} previewUser={previewUser} onNavigate={onNavigate} />
                </div>
              ) : null}
              {builderSurfaceMode === "compare" && previewUser ? (
                <div className="page-builder-compare-surface">
                  <div className="page-dual-mode-pane page-dual-mode-pane-static">
                    <p className="page-dual-mode-pane-label">静态页面</p>
                    <UiActualPagePreview page={pageConfig} previewUser={previewUser} pathname={targetPath} onNavigate={onNavigate} />
                  </div>
                  <div className="page-dual-mode-pane page-dual-mode-pane-dynamic">
                    <p className="page-dual-mode-pane-label">动态嵌套</p>
                    <DynamicPageRenderer page={pageConfig} previewUser={previewUser} onNavigate={onNavigate} />
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {panelPickerOpen && pageConfig && normalizedPickerPanel ? (
        <div className="page-builder-dialog-backdrop" role="presentation">
          <section className="page-builder-dialog" role="dialog" aria-modal="true" aria-label="查找当前面板">
            <div className="page-builder-dialog-header">
              <div>
                <p className="eyebrow">Panel Finder</p>
                <h3>查找当前面板</h3>
              </div>
              <button type="button" className="secondary" onClick={() => setPanelPickerOpen(false)}>
                关闭
              </button>
            </div>
            <div className="page-builder-dialog-path">
              <span>当前位置</span>
              <code>{normalizedPickerPanel.id}</code>
            </div>
            <div className="page-builder-dialog-actions">
              <button
                type="button"
                className="secondary"
                disabled={!getParentPanelId(pageConfig, normalizedPickerPanel.id)}
                onClick={() => setPickerPanelId(getParentPanelId(pageConfig, normalizedPickerPanel.id))}
              >
                返回上一级
              </button>
              <button
                type="button"
                disabled={!canUseAsWorkingPanel(normalizedPickerPanel)}
                onClick={() => {
                  if (!canUseAsWorkingPanel(normalizedPickerPanel)) {
                    return;
                  }
                  setWorkingPanelId(normalizedPickerPanel.id);
                  setPanelPickerOpen(false);
                }}
              >
                选择此面板
              </button>
            </div>
            <div className="page-builder-directory-list">
              {getAllChildPanels(normalizedPickerPanel, componentMap)
                .filter(canUseAsWorkingPanel)
                .map((child) => {
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setPickerPanelId(child.id)}
                  >
                    <span>目录</span>
                    <strong>{getComponentLabel(child)}</strong>
                    <code>{child.id}</code>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
};
