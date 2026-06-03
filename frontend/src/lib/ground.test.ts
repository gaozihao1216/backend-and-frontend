import test from "node:test";
import assert from "node:assert/strict";
import { STARTER_LEVEL_DATA } from "./level-contracts.js";
import type { Position } from "./level-contracts.js";
import { createGroundFromStroke, getLevelGround, insertGroundPoint, removeGroundPoint, reorderGroundPoint, sampleGroundPath, setGroundType, updateGroundPoint } from "./ground.js";

test("sampleGroundPath returns original points for line ground", () => {
  const ground = getLevelGround(STARTER_LEVEL_DATA);
  assert.equal(ground.type, "line");

  const sampled = sampleGroundPath(ground);
  assert.deepEqual(sampled, ground.points);
});

test("setGroundType converts line ground into bezier control points", () => {
  const nextLevelData = setGroundType(STARTER_LEVEL_DATA, "bezier");
  assert.equal(nextLevelData.ground?.type, "bezier");
  assert.equal(nextLevelData.ground?.controlPoints.length, 5);
  assert.equal(nextLevelData.ground?.controlPoints[0]?.x, 0);
  assert.equal(nextLevelData.ground?.controlPoints.at(-1)?.x, STARTER_LEVEL_DATA.world.width);
});

test("sampleGroundPath for bezier passes through the marked control points", () => {
  const levelData = setGroundType(STARTER_LEVEL_DATA, "bezier");
  assert.equal(levelData.ground?.type, "bezier");
  if (levelData.ground?.type !== "bezier") {
    return;
  }

  const sampled = sampleGroundPath(levelData.ground, 20);
  const firstMarkedPoint = levelData.ground.controlPoints[1]!;
  const middleMarkedPoint = levelData.ground.controlPoints[2]!;
  const lastMarkedPoint = levelData.ground.controlPoints[3]!;

  const containsPoint = (targetX: number, targetY: number) =>
    sampled.some((point) => Math.abs(point.x - targetX) < 1e-6 && Math.abs(point.y - targetY) < 1e-6);

  assert.ok(containsPoint(firstMarkedPoint.x, firstMarkedPoint.y));
  assert.ok(containsPoint(middleMarkedPoint.x, middleMarkedPoint.y));
  assert.ok(containsPoint(lastMarkedPoint.x, lastMarkedPoint.y));
});

test("sampleGroundPath for bezier stays within the local y-range between adjacent marked points", () => {
  const levelData = {
    ...STARTER_LEVEL_DATA,
    ground: {
      type: "bezier" as const,
      controlPoints: [
        { x: 0, y: 740 },
        { x: 300, y: 620 },
        { x: 600, y: 700 },
        { x: 900, y: 640 },
        { x: 1200, y: 720 },
      ],
    },
  };

  const sampled = sampleGroundPath(levelData.ground, 40);
  const segmentSamples = sampled.filter((point) => point.x >= 300 && point.x <= 600);
  const minY = Math.min(levelData.ground.controlPoints[1]!.y, levelData.ground.controlPoints[2]!.y);
  const maxY = Math.max(levelData.ground.controlPoints[1]!.y, levelData.ground.controlPoints[2]!.y);

  assert.ok(segmentSamples.every((point) => point.y >= minY - 1e-6 && point.y <= maxY + 1e-6));
});

test("updateGroundPoint keeps endpoints pinned to world edges", () => {
  const nextLevelData = updateGroundPoint(STARTER_LEVEL_DATA, 0, { x: 120, y: 680 });
  assert.equal(nextLevelData.ground?.type, "line");
  if (nextLevelData.ground?.type !== "line") {
    return;
  }

  assert.equal(nextLevelData.ground.points[0]?.x, 0);
  assert.equal(nextLevelData.ground.points[0]?.y, 680);
});

test("insertGroundPoint adds a new editable point next to the selected point", () => {
  const inserted = insertGroundPoint(STARTER_LEVEL_DATA, 1, "after");
  assert.equal(inserted.levelData.ground?.type, "line");
  if (inserted.levelData.ground?.type !== "line") {
    return;
  }

  assert.equal(inserted.levelData.ground.points.length, 4);
  assert.equal(inserted.pointIndex, 2);
});

test("removeGroundPoint and reorderGroundPoint update line points predictably", () => {
  const inserted = insertGroundPoint(STARTER_LEVEL_DATA, 1, "after");
  const reordered = reorderGroundPoint(inserted.levelData, inserted.pointIndex, "left");
  const removed = removeGroundPoint(reordered.levelData, reordered.pointIndex);

  assert.equal(removed.levelData.ground?.type, "line");
  if (removed.levelData.ground?.type !== "line") {
    return;
  }

  assert.equal(removed.levelData.ground.points.length, 3);
  assert.equal(removed.nextSelectedPointIndex, 1);
});

test("createGroundFromStroke preserves the drawn x positions when replacing ground points", () => {
  const nextLevelData = createGroundFromStroke(STARTER_LEVEL_DATA, [
    { x: 180, y: 720 },
    { x: 240, y: 700 },
    { x: 420, y: 680 },
    { x: 700, y: 710 },
    { x: 980, y: 690 },
  ]);

  assert.equal(nextLevelData.ground?.type, "line");
  if (nextLevelData.ground?.type !== "line") {
    return;
  }

  assert.equal(nextLevelData.ground.points[0]?.x, 0);
  assert.equal(nextLevelData.ground.points[1]?.x, 180);
  assert.equal(nextLevelData.ground.points.at(-1)?.x, STARTER_LEVEL_DATA.world.width);
  assert.ok((nextLevelData.ground.points.length ?? 0) >= 2);
});

test("createGroundFromStroke replaces only the drawn x-range instead of stretching across the whole world", () => {
  const nextLevelData = createGroundFromStroke(STARTER_LEVEL_DATA, [
    { x: 300, y: 690 },
    { x: 420, y: 670 },
    { x: 560, y: 680 },
  ]);

  assert.equal(nextLevelData.ground?.type, "line");
  if (nextLevelData.ground?.type !== "line") {
    return;
  }

  assert.equal(nextLevelData.ground.points[0]?.x, 0);
  assert.equal(nextLevelData.ground.points[1]?.x, 300);
  assert.equal(nextLevelData.ground.points[2]?.x, 420);
  assert.equal(nextLevelData.ground.points[3]?.x, 560);
  assert.equal(nextLevelData.ground.points.at(-1)?.x, STARTER_LEVEL_DATA.world.width);
});

test("createGroundFromStroke keeps the stored stroke points relatively sparse", () => {
  const nextLevelData = createGroundFromStroke(STARTER_LEVEL_DATA, [
    { x: 200, y: 720 },
    { x: 208, y: 718 },
    { x: 216, y: 716 },
    { x: 224, y: 714 },
    { x: 232, y: 712 },
    { x: 280, y: 700 },
    { x: 340, y: 690 },
    { x: 420, y: 682 },
  ]);

  assert.equal(nextLevelData.ground?.type, "line");
  if (nextLevelData.ground?.type !== "line") {
    return;
  }

  const replacedPoints = nextLevelData.ground.points.filter((point: Position) => point.x >= 200 && point.x <= 420);
  assert.ok(replacedPoints.length <= 5);
});

test.skip("createGroundFromStroke infers endpoint height from interior points for smoother edges: legacy point/stroke-based boundary construction; boundary editing will be redesigned; old endpoint inference expectations are no longer stable product requirements", () => {
  const nextLevelData = createGroundFromStroke(STARTER_LEVEL_DATA, [
    { x: 200, y: 760 },
    { x: 320, y: 700 },
    { x: 440, y: 680 },
    { x: 560, y: 690 },
    { x: 680, y: 760 },
  ]);

  assert.equal(nextLevelData.ground?.type, "line");
  if (nextLevelData.ground?.type !== "line") {
    return;
  }

  const replacedPoints = nextLevelData.ground.points.filter((point: Position) => point.x >= 200 && point.x <= 680);
  assert.equal(replacedPoints[0]?.x, 200);
  assert.equal(replacedPoints.at(-1)?.x, 680);
  assert.ok(Math.abs((replacedPoints[0]?.y ?? 0) - 720) < 1);
  assert.ok(Math.abs((replacedPoints.at(-1)?.y ?? 0) - 700) < 1);
  assert.notEqual(replacedPoints[0]?.y, 760);
  assert.notEqual(replacedPoints.at(-1)?.y, 760);
});

test("createGroundFromStroke keeps more points around a sharp bend than on flatter spans", () => {
  const strokePoints = Array.from({ length: 60 }, (_, index) => {
    const x = 120 + (index * 16);
    const y = x < 440
      ? 720 - ((x - 120) * 0.08)
      : x < 520
        ? 694 - ((x - 440) * 1.25)
        : 594 + ((x - 520) * 0.1);
    return { x, y };
  });

  const nextLevelData = createGroundFromStroke(STARTER_LEVEL_DATA, strokePoints);
  assert.equal(nextLevelData.ground?.type, "line");
  if (nextLevelData.ground?.type !== "line") {
    return;
  }

  const bendPoints = nextLevelData.ground.points.filter((point: Position) => point.x >= 400 && point.x <= 560);
  const flatterPoints = nextLevelData.ground.points.filter((point: Position) => point.x >= 120 && point.x <= 360);
  assert.ok(bendPoints.length >= 3);
  assert.ok(bendPoints.length > flatterPoints.length);
});

test("createGroundFromStroke keeps long straight strokes sparse even when many points are drawn", () => {
  const strokePoints = Array.from({ length: 70 }, (_, index) => ({
    x: 100 + (index * 14),
    y: 700 - (index * 0.4),
  }));

  const nextLevelData = createGroundFromStroke(STARTER_LEVEL_DATA, strokePoints);
  assert.equal(nextLevelData.ground?.type, "line");
  if (nextLevelData.ground?.type !== "line") {
    return;
  }

  const replacedPoints = nextLevelData.ground.points.filter((point: Position) => point.x >= 100 && point.x <= 1066);
  assert.ok(replacedPoints.length <= 8);
});

test("createGroundFromStroke keeps gentle curves relatively sparse", () => {
  const strokePoints = Array.from({ length: 64 }, (_, index) => {
    const x = 120 + (index * 15);
    const t = index / 63;
    return {
      x,
      y: 690 - (Math.sin(t * Math.PI) * 22),
    };
  });

  const nextLevelData = createGroundFromStroke(STARTER_LEVEL_DATA, strokePoints);
  assert.equal(nextLevelData.ground?.type, "line");
  if (nextLevelData.ground?.type !== "line") {
    return;
  }

  const replacedPoints = nextLevelData.ground.points.filter((point: Position) => point.x >= 120 && point.x <= 1065);
  assert.ok(replacedPoints.length <= 10);
  assert.ok(replacedPoints.some((point: Position) => point.x >= 540 && point.x <= 660));
});
