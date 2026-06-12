import type { ResizeHandle } from "../../objects/director-page/panel-create-types.js";

const escapeSelectorValue = (value: string) =>
  typeof CSS !== "undefined" && CSS.escape
    ? CSS.escape(value)
    : value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

export const isPanelCreateCanvasInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest("button, input, select, textarea, a, label, .panel-create-preview-subpanel-actions"),
  );
};

export const getPanelCreateResizeTarget = (
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

export const getPanelCreateMoveTarget = (
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

export const hitTestPanelCreateChild = (root: HTMLElement, point: { x: number; y: number }) => {
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
