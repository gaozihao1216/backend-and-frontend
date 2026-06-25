import type { WheelEvent } from "react";
import type { PageComponent, PageConfig, PanelComponent } from "../../../../objects/ui-customization/ui-customization-objects.js";
import type { ResizeHandle } from "../objects/page-builder-types.js";

export const isPanelComponent = (component: PageComponent): component is PanelComponent =>
  component.type === "panel";

export const canUseAsWorkingPanel = (component: PageComponent | null | undefined): component is PanelComponent =>
  Boolean(component && component.type === "panel" && component.kind !== "stage");

export const getPanelKindLabel = (kind: PanelComponent["kind"]) => {
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

export const getComponentLabel = (component: PageComponent) => {
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

export const getComponentTypeLabel = (component: PageComponent) => {
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

export const createComponentMap = (components: PageComponent[]) =>
  new Map(components.map((component) => [component.id, component]));

export const getParentPanelId = (pageConfig: PageConfig, componentId: string) =>
  pageConfig.components.find(
    (component) => component.type === "panel" && component.childComponentIds.includes(componentId),
  )?.id ?? null;

export const getButtonControlledPanelId = (component: PageComponent) =>
  component.type === "button" && component.action.type === "openPanel" ? component.action.panelId : null;

export const isControlledPanel = (component: PageComponent): component is PanelComponent =>
  component.type === "panel"
  && (
    component.kind === "overlay"
    || component.panelRole === "popover"
    || component.panelRole === "workflowPanel"
  );

export const createControlledPanelIds = (components: PageComponent[]) => {
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

export const getLogicalPanelChildren = (
  panel: PanelComponent,
  componentMap: Map<string, PageComponent>,
  controlledPanelIds: Set<string>,
) =>
  panel.childComponentIds
    .map((childId) => componentMap.get(childId))
    .filter((child): child is PageComponent => Boolean(child))
    .filter((child) => !(child.type === "panel" && controlledPanelIds.has(child.id)));

export const getControlledPanelForButton = (
  component: PageComponent,
  componentMap: Map<string, PageComponent>,
): PanelComponent | null => {
  const panelId = getButtonControlledPanelId(component);
  const panel = panelId ? componentMap.get(panelId) : null;
  return panel && isPanelComponent(panel) ? panel : null;
};

export const getPanelControlledChildren = (
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

export const getAllChildPanels = (
  panel: PanelComponent,
  componentMap: Map<string, PageComponent>,
) =>
  panel.childComponentIds
    .map((childId) => componentMap.get(childId))
    .filter((child): child is PanelComponent => Boolean(child && child.type === "panel"));

export const createChildComponentId = (pageConfig: PageConfig, parentPanel: PanelComponent) => {
  const existingIds = new Set(pageConfig.components.map((component) => component.id));
  let index = parentPanel.childComponentIds.length + 1;
  let candidate = `${parentPanel.id}.${index}`;

  while (existingIds.has(candidate)) {
    index += 1;
    candidate = `${parentPanel.id}.${index}`;
  }

  return candidate;
};

export const createDefaultComponentName = (
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

export const handleInlineScrollWheel = (event: WheelEvent<HTMLElement>) => {
  event.stopPropagation();
  event.preventDefault();

  if (event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) {
    return;
  }

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  event.currentTarget.scrollLeft += delta;
};

export const escapeSelectorValue = (value: string) =>
  typeof CSS !== "undefined" && CSS.escape
    ? CSS.escape(value)
    : value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

export const hitTestOutlinedComponent = (
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

export const getSelectedMoveTarget = (
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

export const getSelectedResizeTarget = (
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
