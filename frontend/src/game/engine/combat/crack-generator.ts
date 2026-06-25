import type { CrackPoint, CrackSegment, DamageVisualState } from "../core/types.js";

const CRACK_START_THRESHOLD = 0.5;
const EDGE_MARGIN = 6;
const END_MARGIN = 8;
const JITTER_FACTOR = 0.08;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const createDeterministicRandom = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const chooseCrackStart = (
  halfWidth: number,
  halfHeight: number,
  random: () => number,
): {
  start: CrackPoint;
  axis: "horizontal" | "vertical";
  direction: 1 | -1;
} => {
  const edgeIndex = Math.floor(random() * 4);

  switch (edgeIndex) {
    case 0:
      return {
        start: {
          x: -halfWidth + EDGE_MARGIN,
          y: lerp(-halfHeight + EDGE_MARGIN, halfHeight - EDGE_MARGIN, random()),
        },
        axis: "horizontal",
        direction: 1,
      };
    case 1:
      return {
        start: {
          x: halfWidth - EDGE_MARGIN,
          y: lerp(-halfHeight + EDGE_MARGIN, halfHeight - EDGE_MARGIN, random()),
        },
        axis: "horizontal",
        direction: -1,
      };
    case 2:
      return {
        start: {
          x: lerp(-halfWidth + EDGE_MARGIN, halfWidth - EDGE_MARGIN, random()),
          y: -halfHeight + EDGE_MARGIN,
        },
        axis: "vertical",
        direction: 1,
      };
    default:
      return {
        start: {
          x: lerp(-halfWidth + EDGE_MARGIN, halfWidth - EDGE_MARGIN, random()),
          y: halfHeight - EDGE_MARGIN,
        },
        axis: "vertical",
        direction: -1,
      };
  }
};

const buildMainCrack = (
  width: number,
  height: number,
  damageRatio: number,
  seed: number,
): CrackSegment[] => {
  if (damageRatio < CRACK_START_THRESHOLD) {
    return [];
  }

  const normalizedDamage = clamp(
    (damageRatio - CRACK_START_THRESHOLD) / (1 - CRACK_START_THRESHOLD),
    0,
    1,
  );
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const random = createDeterministicRandom(seed);
  const { start, axis, direction } = chooseCrackStart(halfWidth, halfHeight, random);
  const maxLength =
    axis === "horizontal"
      ? halfWidth - END_MARGIN
      : halfHeight - END_MARGIN;
  const targetLength = Math.max(0, maxLength * normalizedDamage * 0.92);
  const segmentCount = 6;
  const points: CrackPoint[] = [start];

  for (let index = 1; index <= segmentCount; index += 1) {
    const progress = index / segmentCount;
    const mainDistance = targetLength * progress * direction;
    const sidewaysJitter = (random() - 0.5) * 2;

    if (axis === "horizontal") {
      const x = clamp(start.x + mainDistance, -halfWidth + EDGE_MARGIN, halfWidth - END_MARGIN);
      const jitterLimit = Math.max(3, height * JITTER_FACTOR * normalizedDamage);
      const y = clamp(
        start.y + sidewaysJitter * jitterLimit,
        -halfHeight + EDGE_MARGIN,
        halfHeight - EDGE_MARGIN,
      );
      points.push({ x, y });
      continue;
    }

    const y = clamp(start.y + mainDistance, -halfHeight + EDGE_MARGIN, halfHeight - END_MARGIN);
    const jitterLimit = Math.max(3, width * JITTER_FACTOR * normalizedDamage);
    const x = clamp(
      start.x + sidewaysJitter * jitterLimit,
      -halfWidth + EDGE_MARGIN,
      halfWidth - EDGE_MARGIN,
    );
    points.push({ x, y });
  }

  return [{ points }];
};

export const createBlockDamageVisuals = (
  width: number,
  height: number,
  damageRatio: number,
  seed: number,
): DamageVisualState => ({
  damageRatio,
  cracks: buildMainCrack(width, height, damageRatio, seed),
});
