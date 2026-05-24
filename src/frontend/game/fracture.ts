import Matter from "matter-js";
import type { Body, Vector as MatterVector } from "matter-js";
import type { MaterialParams } from "./materials.js";

const { Vector } = Matter;

const MIN_BREAK_DURATION_MS = 70;
const MAX_BREAK_DURATION_MS = 260;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export type FractureResponse = {
  breakDuration: number;
  fractureImpulseCap: number;
  effectiveImpulse: number;
  velocityPreservationRatio: number;
};

export const computeCollisionImpulse = (bodyA: Body, bodyB: Body, normal: MatterVector) => {
  const relativeVelocity = Vector.sub(bodyA.velocity, bodyB.velocity);
  const normalSpeed = Math.abs(Vector.dot(relativeVelocity, normal));
  const inverseMassA = bodyA.isStatic ? 0 : bodyA.inverseMass;
  const inverseMassB = bodyB.isStatic ? 0 : bodyB.inverseMass;
  const inverseMassSum = inverseMassA + inverseMassB;

  if (inverseMassSum <= 0) {
    return 0;
  }

  const reducedMass = 1 / inverseMassSum;
  const restitution = Math.max(bodyA.restitution, bodyB.restitution);

  return normalSpeed * reducedMass * (1 + restitution);
};

const getRectangleDimensions = (body: Body) => {
  const boundsWidth = body.bounds.max.x - body.bounds.min.x;
  const boundsHeight = body.bounds.max.y - body.bounds.min.y;
  const angle = body.angle ?? 0;
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  const determinant = cos * cos - sin * sin;

  if (Math.abs(determinant) < 1e-4) {
    return null;
  }

  const width = (boundsWidth * cos - boundsHeight * sin) / determinant;
  const height = (boundsHeight * cos - boundsWidth * sin) / determinant;

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return { width, height };
};

export const computeEffectiveThickness = (body: Body, normal: MatterVector) => {
  if (body.circleRadius) {
    return body.circleRadius * 2;
  }

  const rectangle = getRectangleDimensions(body);
  if (rectangle) {
    const localXAxis = {
      x: Math.cos(body.angle),
      y: Math.sin(body.angle),
    };
    const localYAxis = {
      x: -Math.sin(body.angle),
      y: Math.cos(body.angle),
    };

    // Approximate the thickness of a rotated rectangle along the collision normal
    // by projecting the rectangle's local width/height axes onto that normal.
    const projectedWidth = Math.abs(Vector.dot(normal, localXAxis)) * rectangle.width;
    const projectedHeight = Math.abs(Vector.dot(normal, localYAxis)) * rectangle.height;

    return Math.max(1, projectedWidth + projectedHeight);
  }

  const projections = body.vertices.map((vertex) => Vector.dot(vertex, normal));
  const minProjection = Math.min(...projections);
  const maxProjection = Math.max(...projections);

  return Math.max(1, maxProjection - minProjection);
};

export const computeBreakDuration = (effectiveThickness: number, crackSpeed: number) =>
  clamp((effectiveThickness / crackSpeed) * 1000, MIN_BREAK_DURATION_MS, MAX_BREAK_DURATION_MS);

export const computeFractureImpulseCap = (material: MaterialParams, breakDurationMs: number) =>
  material.maxResistForce * (breakDurationMs / 1000);

export const computeVelocityPreservationRatio = (rawImpulse: number, effectiveImpulse: number) => {
  if (rawImpulse <= 0) {
    return 1;
  }

  return clamp(1 - effectiveImpulse / rawImpulse, 0.08, 1);
};

export const computeFractureResponse = (
  material: MaterialParams,
  effectiveThickness: number,
  rawImpulse: number,
): FractureResponse => {
  const breakDuration = computeBreakDuration(effectiveThickness, material.crackSpeed);
  const fractureImpulseCap = computeFractureImpulseCap(material, breakDuration);
  const effectiveImpulse = Math.min(rawImpulse, fractureImpulseCap);

  return {
    breakDuration,
    fractureImpulseCap,
    effectiveImpulse,
    velocityPreservationRatio: computeVelocityPreservationRatio(rawImpulse, effectiveImpulse),
  };
};
