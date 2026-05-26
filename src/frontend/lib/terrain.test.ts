import test from "node:test";
import assert from "node:assert/strict";
import { STARTER_LEVEL_DATA } from "../../shared/levels/starter-level.js";
import {
  addTerrainVoidSpan,
  clearTerrainCeilingBoundary,
  createBottomBoundaryFromTop,
  createTerrainBoundaryFromStroke,
  createTerrainVoidSpanFromStroke,
  ensureTerrainCeilingBoundary,
  getLevelTerrain,
  sampleBoundaryPathSegments,
  sampleTerrainPolygon,
  updateTerrainBoundaryPoint,
} from "./ground.js";

test("getLevelTerrain falls back from legacy ground data", () => {
  const terrain = getLevelTerrain(STARTER_LEVEL_DATA);

  assert.equal(terrain.ceilingBoundary, undefined);
  assert.equal(terrain.groundBoundary.type, "line");
  assert.equal(terrain.voidSpans.length, 0);
});

test("createBottomBoundaryFromTop offsets the top boundary downward", () => {
  const ceilingBoundary = {
    type: "line" as const,
    points: [
      { x: 120, y: 64 },
      { x: 360, y: 96 },
      { x: 640, y: 72 },
    ],
  };
  const bottom = createBottomBoundaryFromTop(STARTER_LEVEL_DATA, ceilingBoundary, 80);

  assert.equal(bottom.type, "line");
  if (bottom.type !== "line") {
    return;
  }

  assert.equal(bottom.points.length, ceilingBoundary.points.length);
  assert.equal(bottom.points[1]?.x, ceilingBoundary.points[1]?.x);
  assert.equal(
    bottom.points[1]?.y,
    Math.min(STARTER_LEVEL_DATA.world.height, (ceilingBoundary.points[1]?.y ?? 0) + 80),
  );
});

test("createTerrainBoundaryFromStroke updates only the requested boundary", () => {
  const nextLevelData = createTerrainBoundaryFromStroke(
    STARTER_LEVEL_DATA,
    "ground",
    [
      { x: 200, y: 760 },
      { x: 380, y: 770 },
      { x: 560, y: 768 },
      { x: 760, y: 772 },
    ],
  );

  const terrain = getLevelTerrain(nextLevelData);
  assert.equal(terrain.ceilingBoundary, undefined);
  assert.equal(terrain.groundBoundary.type, "line");
  if (terrain.groundBoundary.type !== "line") {
    return;
  }

  assert.ok((terrain.groundBoundary.points[1]?.y ?? 0) >= 768);
});

test("ceiling endpoints are not forced to x world edges", () => {
  const withCeiling = createTerrainBoundaryFromStroke(
    STARTER_LEVEL_DATA,
    "ceiling",
    [
      { x: 180, y: 820 },
      { x: 320, y: 560 },
      { x: 540, y: 680 },
    ],
  );
  const moved = updateTerrainBoundaryPoint(
    withCeiling,
    "ceiling",
    0,
    { x: 140, y: withCeiling.world.height },
  );

  const terrain = getLevelTerrain(moved);
  assert.ok(terrain.ceilingBoundary);
  if (!terrain.ceilingBoundary || terrain.ceilingBoundary.type !== "line") {
    return;
  }

  assert.equal(terrain.ceilingBoundary.points[0]?.x, 140);
  assert.equal(terrain.ceilingBoundary.points[0]?.y, withCeiling.world.height);
});

test("ensureTerrainCeilingBoundary creates a boundary-attached ceiling and clear removes it", () => {
  const withCeiling = ensureTerrainCeilingBoundary(STARTER_LEVEL_DATA);
  const ensuredTerrain = getLevelTerrain(withCeiling);

  assert.ok(ensuredTerrain.ceilingBoundary);
  if (!ensuredTerrain.ceilingBoundary || ensuredTerrain.ceilingBoundary.type !== "line") {
    return;
  }

  assert.equal(ensuredTerrain.ceilingBoundary.points[0]?.x, 0);
  assert.equal(ensuredTerrain.ceilingBoundary.points.at(-1)?.x, STARTER_LEVEL_DATA.world.width);

  const cleared = clearTerrainCeilingBoundary(withCeiling);
  assert.equal(getLevelTerrain(cleared).ceilingBoundary, undefined);
});

test("stroke endpoints are projected onto world boundary", () => {
  const withCeiling = createTerrainBoundaryFromStroke(
    STARTER_LEVEL_DATA,
    "ceiling",
    [
      { x: 180, y: 700 },
      { x: 320, y: 540 },
      { x: 620, y: 730 },
    ],
  );
  const terrain = getLevelTerrain(withCeiling);

  assert.ok(terrain.ceilingBoundary);
  if (!terrain.ceilingBoundary || terrain.ceilingBoundary.type !== "line") {
    return;
  }

  const startPoint = terrain.ceilingBoundary.points[0];
  const endPoint = terrain.ceilingBoundary.points.at(-1);
  assert.ok(startPoint);
  assert.ok(endPoint);
  assert.ok(startPoint?.x === 0 || startPoint?.y === STARTER_LEVEL_DATA.world.height);
  assert.ok(endPoint?.x === STARTER_LEVEL_DATA.world.width || endPoint?.y === STARTER_LEVEL_DATA.world.height);
});

test("createTerrainVoidSpanFromStroke creates a horizontal void span", () => {
  const span = createTerrainVoidSpanFromStroke(STARTER_LEVEL_DATA, [
    { x: 300, y: 760 },
    { x: 380, y: 790 },
    { x: 460, y: 760 },
    { x: 380, y: 730 },
  ]);

  assert.ok(span);
  assert.equal(span?.startX, 300);
  assert.equal(span?.endX, 460);
});

test("sampleTerrainPolygon splits terrain into multiple solid polygons around void spans", () => {
  const span = createTerrainVoidSpanFromStroke(STARTER_LEVEL_DATA, [
    { x: 300, y: 760 },
    { x: 380, y: 790 },
    { x: 460, y: 760 },
    { x: 380, y: 730 },
  ]);
  assert.ok(span);
  if (!span) {
    return;
  }

  const levelDataWithVoid = addTerrainVoidSpan(STARTER_LEVEL_DATA, span);
  const terrain = getLevelTerrain(levelDataWithVoid);
  assert.equal(terrain.voidSpans.length, 1);
  const polygon = sampleTerrainPolygon(levelDataWithVoid, getLevelTerrain(levelDataWithVoid));

  assert.equal(polygon.polygons.length, 2);
  assert.ok(polygon.polygons.every((shape) => shape.length >= 4));
});

test("boundary breakpoints near top or bottom split ground into multiple solid segments", () => {
  const levelData = createTerrainBoundaryFromStroke(
    STARTER_LEVEL_DATA,
    "ground",
    [
      { x: 0, y: 760 },
      { x: 220, y: 700 },
      { x: 360, y: STARTER_LEVEL_DATA.world.height },
      { x: 520, y: STARTER_LEVEL_DATA.world.height },
      { x: 760, y: 740 },
      { x: STARTER_LEVEL_DATA.world.width, y: 760 },
    ],
  );

  const terrain = getLevelTerrain(levelData);
  const segments = sampleBoundaryPathSegments(levelData, terrain.groundBoundary);
  const polygon = sampleTerrainPolygon(levelData, terrain);

  assert.equal(segments.length, 2);
  assert.equal(polygon.polygons.length, 2);
  assert.ok((segments[0]?.at(-1)?.x ?? 0) <= 360);
  assert.ok((segments[1]?.[0]?.x ?? 0) >= 520);
  const polygonMaxXs = polygon.polygons.map((shape) => Math.max(...shape.map((point) => point.x))).sort((left, right) => left - right);
  const polygonMinXs = polygon.polygons.map((shape) => Math.min(...shape.map((point) => point.x))).sort((left, right) => left - right);
  assert.ok((polygonMaxXs[0] ?? 0) <= 360);
  assert.ok((polygonMinXs[1] ?? 0) >= 520);
});
