import Matter from "matter-js";
import type { GameBody } from "../types.js";

const { Vector } = Matter;

export type WorldPoint = { x: number; y: number };

export const distanceBetween = (a: WorldPoint, b: WorldPoint) => Math.hypot(a.x - b.x, a.y - b.y);

export const getBodiesInRadius = (
  bodies: GameBody[],
  center: WorldPoint,
  radius: number,
  kinds?: Array<GameBody["renderKind"]>,
) =>
  bodies.filter((body) => {
    if (body.destroyed || body.isStatic && body.renderKind === "ground") {
      return false;
    }

    if (kinds && body.renderKind && !kinds.includes(body.renderKind)) {
      return false;
    }

    return distanceBetween(center, body.position) <= radius + (body.circleRadius ?? 0);
  });

export const getForwardConeBodies = (
  bodies: GameBody[],
  origin: WorldPoint,
  direction: WorldPoint,
  length: number,
  width: number,
) => {
  const dirLength = Math.hypot(direction.x, direction.y);
  if (dirLength <= 0.001) {
    return [];
  }

  const forward = Vector.normalise({ x: direction.x, y: direction.y });
  const halfWidth = width / 2;

  return bodies.filter((body) => {
    if (body.destroyed || body.renderKind === "ground") {
      return false;
    }

    const offset = Vector.sub(body.position, origin);
    const forwardDistance = Vector.dot(offset, forward);
    if (forwardDistance < 0 || forwardDistance > length) {
      return false;
    }

    const lateral = Math.abs(Vector.dot(offset, { x: -forward.y, y: forward.x }));
    return lateral <= halfWidth + (body.circleRadius ?? 0);
  });
};

export const radialFalloff = (distance: number, radius: number, falloff: number) => {
  if (radius <= 0) {
    return 0;
  }

  const ratio = Math.min(1, Math.max(0, distance / radius));
  return 1 - ratio * falloff;
};

export const outwardDirection = (center: WorldPoint, target: WorldPoint) => {
  const delta = Vector.sub(target, center);
  const length = Vector.magnitude(delta);
  if (length <= 0.001) {
    return { x: 0, y: -1 };
  }

  return Vector.div(delta, length);
};
