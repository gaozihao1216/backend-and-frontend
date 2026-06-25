import type { ButtonImageFrame } from "../../../../objects/ui-customization/ui-customization-objects.js";

export type PatternLayerResizeHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export const PATTERN_LAYER_RESIZE_HANDLES: PatternLayerResizeHandle[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

export const clampPatternFrameValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const movePatternFrame = (
  startFrame: ButtonImageFrame,
  deltaXPercent: number,
  deltaYPercent: number,
): ButtonImageFrame => ({
  ...startFrame,
  x: clampPatternFrameValue(startFrame.x + deltaXPercent, -25, 125),
  y: clampPatternFrameValue(startFrame.y + deltaYPercent, -25, 125),
});

export const resizePatternFrame = (
  startFrame: ButtonImageFrame,
  handle: PatternLayerResizeHandle,
  deltaXPercent: number,
  deltaYPercent: number,
): ButtonImageFrame => {
  const minSize = 4;
  const isLeft = handle === "top-left" || handle === "bottom-left";
  const isTop = handle === "top-left" || handle === "top-right";
  let nextX = startFrame.x;
  let nextY = startFrame.y;
  let nextWidth = startFrame.width;
  let nextHeight = startFrame.height;

  if (isLeft) {
    nextX = clampPatternFrameValue(startFrame.x + deltaXPercent, -25, startFrame.x + startFrame.width - minSize);
    nextWidth = startFrame.width + startFrame.x - nextX;
  } else {
    nextWidth = clampPatternFrameValue(startFrame.width + deltaXPercent, minSize, 125);
  }

  if (isTop) {
    nextY = clampPatternFrameValue(startFrame.y + deltaYPercent, -25, startFrame.y + startFrame.height - minSize);
    nextHeight = startFrame.height + startFrame.y - nextY;
  } else {
    nextHeight = clampPatternFrameValue(startFrame.height + deltaYPercent, minSize, 125);
  }

  return { x: nextX, y: nextY, width: nextWidth, height: nextHeight };
};
