import type { ComponentPosition } from "../../../../objects/ui-customization/ui-customization-objects.js";

export type ComponentResizeHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export const COMPONENT_RESIZE_HANDLES: ComponentResizeHandle[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

const toUnitDelta = (
  delta: number,
  parentSize: number,
  unit: ComponentPosition["unit"],
) => (unit === "px" ? delta : (delta / parentSize) * 100);

export const moveComponentPosition = (
  position: ComponentPosition,
  deltaX: number,
  deltaY: number,
  parentWidth: number,
  parentHeight: number,
): ComponentPosition => {
  const nextX = position.unit === "px"
    ? position.x + deltaX
    : position.x + toUnitDelta(deltaX, parentWidth, position.unit);
  const nextY = position.unit === "px"
    ? position.y + deltaY
    : position.y + toUnitDelta(deltaY, parentHeight, position.unit);

  return {
    ...position,
    x: Math.max(0, nextX),
    y: Math.max(0, nextY),
  };
};

export const resizeComponentPosition = (
  position: ComponentPosition,
  handle: ComponentResizeHandle,
  deltaX: number,
  deltaY: number,
  parentWidth: number,
  parentHeight: number,
  options?: {
    minWidth?: number;
    minHeight?: number;
    lockAspectRatio?: number;
  },
): ComponentPosition => {
  const minWidth = options?.minWidth ?? (position.unit === "px" ? 24 : 2);
  const minHeight = options?.minHeight ?? (position.unit === "px" ? 18 : 2);
  const deltaUnitX = toUnitDelta(deltaX, parentWidth, position.unit);
  const deltaUnitY = toUnitDelta(deltaY, parentHeight, position.unit);
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

  const lockedAspectRatio = options?.lockAspectRatio;
  if (typeof lockedAspectRatio === "number" && lockedAspectRatio > 0) {
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
    ...position,
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
  };
};
