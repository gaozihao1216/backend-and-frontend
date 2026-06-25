import test from "node:test";
import assert from "node:assert/strict";
import Matter from "matter-js";
import { computeEffectiveThickness, computeFractureResponse } from "./fracture.js";
import { MATERIAL_PARAMS } from "./materials.js";

const { Bodies } = Matter;

const normalX = { x: 1, y: 0 };

test("thin glass fractures quickly and preserves more bird speed", () => {
  const glass = Bodies.rectangle(0, 0, 14, 80);
  const wood = Bodies.rectangle(0, 0, 48, 80);

  const glassThickness = computeEffectiveThickness(glass, normalX);
  const woodThickness = computeEffectiveThickness(wood, normalX);
  const glassFracture = computeFractureResponse(MATERIAL_PARAMS.glass, glassThickness, 12);
  const woodFracture = computeFractureResponse(MATERIAL_PARAMS.wood, woodThickness, 12);

  assert.ok(glassFracture.breakDuration < woodFracture.breakDuration);
  assert.ok(glassFracture.velocityPreservationRatio > woodFracture.velocityPreservationRatio);
  assert.ok(glassFracture.effectiveImpulse < woodFracture.effectiveImpulse);
});

test("medium wood plate has intermediate break duration and drag", () => {
  const wood = Bodies.rectangle(0, 0, 48, 80);
  const glass = Bodies.rectangle(0, 0, 14, 80);
  const stone = Bodies.rectangle(0, 0, 92, 92);

  const woodFracture = computeFractureResponse(MATERIAL_PARAMS.wood, computeEffectiveThickness(wood, normalX), 12);
  const glassFracture = computeFractureResponse(MATERIAL_PARAMS.glass, computeEffectiveThickness(glass, normalX), 12);
  const stoneFracture = computeFractureResponse(MATERIAL_PARAMS.stone, computeEffectiveThickness(stone, normalX), 12);

  assert.ok(woodFracture.breakDuration > glassFracture.breakDuration);
  assert.ok(woodFracture.breakDuration < stoneFracture.breakDuration);
  assert.ok(woodFracture.velocityPreservationRatio < glassFracture.velocityPreservationRatio);
  assert.ok(woodFracture.velocityPreservationRatio > stoneFracture.velocityPreservationRatio);
});

test("thick stone resists fracture longer and is hard to punch through", () => {
  const stone = Bodies.rectangle(0, 0, 92, 92);
  const glass = Bodies.rectangle(0, 0, 14, 80);

  const stoneThickness = computeEffectiveThickness(stone, normalX);
  const glassThickness = computeEffectiveThickness(glass, normalX);
  const stoneFracture = computeFractureResponse(MATERIAL_PARAMS.stone, stoneThickness, 12);
  const glassFracture = computeFractureResponse(MATERIAL_PARAMS.glass, glassThickness, 12);

  assert.ok(stoneFracture.breakDuration > glassFracture.breakDuration);
  assert.ok(stoneFracture.effectiveImpulse > glassFracture.effectiveImpulse);
  assert.ok(stoneFracture.velocityPreservationRatio < glassFracture.velocityPreservationRatio);
  assert.ok(MATERIAL_PARAMS.stone.fractureThreshold > MATERIAL_PARAMS.glass.fractureThreshold);
  assert.ok(MATERIAL_PARAMS.stone.maxHp > MATERIAL_PARAMS.glass.maxHp);
});
