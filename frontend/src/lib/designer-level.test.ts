import test from "node:test";
import assert from "node:assert/strict";
import { STARTER_LEVEL_DATA } from "./level-contracts.js";
import {
  addEntityToSelection,
  addObstacleFromCorners,
  addPigFromCorners,
  addObstacleAt,
  createObstacleFromCorners,
  createPigFromCorners,
  getEntitiesInSelectionBox,
  getGroupTransformSnapshot,
  getEntitySnapshot,
  getMinimumAreaSelectionFrame,
  getSelectionFrame,
  getSelectionFrameFromHandle,
  getSelectionBounds,
  moveEntityTo,
  moveEntitiesByDelta,
  normalizeSelectionBox,
  pasteClipboardEntity,
  pasteClipboardSelection,
  rotateEntitiesAroundSelectionCenter,
  scaleEntitiesFromSelectionBounds,
  selectSingleEntity,
  snapPointToGrid,
  toggleEntityInSelection,
  updateObstacleBounds,
} from "./designer-level.js";

test("getEntitySnapshot returns a detached obstacle copy", () => {
  const snapshot = getEntitySnapshot(STARTER_LEVEL_DATA, "obstacle-glass-panel");

  assert.ok(snapshot);
  assert.equal(snapshot?.kind, "obstacle");
  assert.notEqual(snapshot?.entity, STARTER_LEVEL_DATA.obstacles[0]);

  if (snapshot?.kind === "obstacle") {
    snapshot.entity.position.x = 999;
  }

  assert.equal(STARTER_LEVEL_DATA.obstacles[0]?.position.x, 700);
});

test("pasteClipboardEntity places the copied obstacle at the requested center", () => {
  const snapshot = getEntitySnapshot(STARTER_LEVEL_DATA, "obstacle-glass-panel");
  assert.ok(snapshot);

  const pasted = pasteClipboardEntity(STARTER_LEVEL_DATA, snapshot!, { x: 730, y: 650 });
  assert.ok(pasted);
  const nextObstacle = pasted.levelData.obstacles.find((obstacle) => obstacle.id === pasted.entityId);

  assert.ok(nextObstacle);
  assert.equal(pasted.entityId, "obstacle-glass-1");
  assert.equal(nextObstacle?.position.x, 730);
  assert.equal(nextObstacle?.position.y, 650);
});

test("pasteClipboardSelection duplicates all selected entities while preserving relative layout", () => {
  const pasted = pasteClipboardSelection(
    STARTER_LEVEL_DATA,
    {
      entities: [
        getEntitySnapshot(STARTER_LEVEL_DATA, "obstacle-glass-panel")!,
        getEntitySnapshot(STARTER_LEVEL_DATA, "enemy-1")!,
      ],
      primaryEntityId: "enemy-1",
    },
    { x: 250, y: 250 },
  );

  assert.ok(pasted);
  assert.deepEqual(pasted?.entityIds, ["obstacle-glass-1", "enemy-3"]);
  assert.equal(pasted?.primaryEntityId, "enemy-3");
  assert.equal(
    pasted?.levelData.obstacles.find((candidate) => candidate.id === "obstacle-glass-1")?.position.x,
    141,
  );
  assert.equal(
    pasted?.levelData.enemies.find((candidate) => candidate.id === "enemy-3")?.position.x,
    341,
  );
});

test("addObstacleAt ignores placements that would overlap an existing entity", () => {
  const nextLevelData = addObstacleAt(STARTER_LEVEL_DATA, "wood", 700, 640);

  assert.equal(nextLevelData, STARTER_LEVEL_DATA);
});

test("createObstacleFromCorners builds an obstacle from dragged opposite corners", () => {
  const obstacle = createObstacleFromCorners(
    STARTER_LEVEL_DATA,
    "wood",
    { x: 100, y: 150 },
    { x: 180, y: 230 },
  );

  assert.deepEqual(obstacle, {
    id: "preview",
    material: "wood",
    position: { x: 140, y: 190 },
    angle: 0,
    size: { width: 80, height: 80 },
  });
});

test("addObstacleFromCorners creates an obstacle using the dragged rectangle", () => {
  const nextLevelData = addObstacleFromCorners(
    STARTER_LEVEL_DATA,
    "stone",
    { x: 120, y: 160 },
    { x: 220, y: 260 },
  );
  const obstacle = nextLevelData.obstacles.find((candidate) => candidate.id === "obstacle-stone-1");

  assert.ok(obstacle);
  assert.equal(obstacle?.position.x, 170);
  assert.equal(obstacle?.position.y, 210);
  assert.equal(obstacle?.size.width, 100);
  assert.equal(obstacle?.size.height, 100);
});

test("createPigFromCorners converts the dragged rectangle into a maximal inscribed square from the start corner", () => {
  const pig = createPigFromCorners(
    STARTER_LEVEL_DATA,
    { x: 120, y: 160 },
    { x: 220, y: 300 },
  );

  assert.deepEqual(pig, {
    id: "preview",
    type: "pig",
    position: { x: 170, y: 210 },
    size: { width: 100, height: 100 },
  });
});

test("addPigFromCorners creates a pig sized by the inscribed square", () => {
  const nextLevelData = addPigFromCorners(
    STARTER_LEVEL_DATA,
    { x: 120, y: 160 },
    { x: 220, y: 300 },
  );
  const pig = nextLevelData.enemies.find((candidate) => candidate.id === "enemy-3");

  assert.ok(pig);
  assert.equal(pig?.position.x, 170);
  assert.equal(pig?.position.y, 210);
  assert.equal(pig?.size?.width, 100);
  assert.equal(pig?.size?.height, 100);
});

test("moveEntityTo ignores moves that would overlap an existing entity", () => {
  const nextLevelData = moveEntityTo(STARTER_LEVEL_DATA, "enemy-1", 860, 630);
  const enemy = nextLevelData.enemies.find((candidate) => candidate.id === "enemy-1");

  assert.equal(nextLevelData, STARTER_LEVEL_DATA);
  assert.equal(enemy?.position.x, 900);
  assert.equal(enemy?.position.y, 470);
});

test("updateObstacleBounds ignores resizes that would overlap an existing entity", () => {
  const nextLevelData = updateObstacleBounds(STARTER_LEVEL_DATA, "obstacle-wood-panel", 860, 630, 300, 150);
  const obstacle = nextLevelData.obstacles.find((candidate) => candidate.id === "obstacle-wood-panel");

  assert.equal(nextLevelData, STARTER_LEVEL_DATA);
  assert.equal(obstacle?.size.width, 44);
  assert.equal(obstacle?.size.height, 150);
});

test("pasteClipboardEntity rejects enemy paste when the requested center would overflow the canvas", () => {
  const snapshot = getEntitySnapshot(STARTER_LEVEL_DATA, "enemy-2");
  assert.ok(snapshot);

  const pasted = pasteClipboardEntity(STARTER_LEVEL_DATA, snapshot!, { x: 10, y: 10 });

  assert.equal(pasted, null);
});

test("pasteClipboardEntity rejects pastes that would overlap an existing entity", () => {
  const snapshot = getEntitySnapshot(STARTER_LEVEL_DATA, "enemy-1");
  assert.ok(snapshot);

  const pasted = pasteClipboardEntity(STARTER_LEVEL_DATA, snapshot!, { x: 860, y: 630 });

  assert.equal(pasted, null);
});

test("pasteClipboardEntity rejects rotated obstacle paste when any corner would overflow the canvas", () => {
  const snapshot = getEntitySnapshot(STARTER_LEVEL_DATA, "obstacle-glass-panel");
  assert.ok(snapshot);

  if (snapshot?.kind === "obstacle") {
    snapshot.entity.angle = Math.PI / 4;
  }

  const pasted = pasteClipboardEntity(STARTER_LEVEL_DATA, snapshot!, { x: 10, y: 10 });

  assert.equal(pasted, null);
});

test("snapPointToGrid snaps to the nearest grid intersection", () => {
  assert.deepEqual(snapPointToGrid({ x: 33, y: 47 }, 16), { x: 32, y: 48 });
});

test("selection helpers preserve single select, append and toggle semantics", () => {
  assert.deepEqual(selectSingleEntity("enemy-1"), ["enemy-1"]);
  assert.deepEqual(addEntityToSelection(["enemy-1"], "enemy-2"), ["enemy-1", "enemy-2"]);
  assert.deepEqual(toggleEntityInSelection(["enemy-1", "enemy-2"], "enemy-1"), ["enemy-2"]);
});

test("getSelectionBounds returns the envelope of selected entities", () => {
  const bounds = getSelectionBounds(STARTER_LEVEL_DATA, ["obstacle-glass-panel", "enemy-1"]);

  assert.deepEqual(bounds, {
    minX: 690,
    minY: 442,
    maxX: 928,
    maxY: 710,
  });
});

test("getEntitiesInSelectionBox returns entities fully contained in the marquee", () => {
  const entityIds = getEntitiesInSelectionBox(
    STARTER_LEVEL_DATA,
    normalizeSelectionBox({ x: 650, y: 430 }, { x: 940, y: 720 }),
  );

  assert.deepEqual(entityIds.sort(), ["enemy-1", "obstacle-glass-panel", "obstacle-glass-top", "obstacle-wood-panel"]);
});

test("moveEntitiesByDelta moves a selected group while preserving relative layout", () => {
  const snapshot = getGroupTransformSnapshot(
    STARTER_LEVEL_DATA,
    ["obstacle-glass-panel", "enemy-1"],
  );
  assert.ok(snapshot);

  const nextLevelData = moveEntitiesByDelta(STARTER_LEVEL_DATA, snapshot!, -100, -50);

  assert.equal(
    nextLevelData.obstacles.find((candidate) => candidate.id === "obstacle-glass-panel")?.position.x,
    600,
  );
  assert.equal(
    nextLevelData.obstacles.find((candidate) => candidate.id === "obstacle-glass-panel")?.position.y,
    590,
  );
  assert.equal(
    nextLevelData.enemies.find((candidate) => candidate.id === "enemy-1")?.position.x,
    800,
  );
  assert.equal(
    nextLevelData.enemies.find((candidate) => candidate.id === "enemy-1")?.position.y,
    420,
  );
});

test("getSelectionFrame returns a rotated multi-selection frame", () => {
  const frame = getSelectionFrame(
    STARTER_LEVEL_DATA,
    ["obstacle-glass-panel", "enemy-1"],
    Math.PI / 2,
  );

  assert.ok(frame);
  assert.ok(Math.abs(frame!.centerX - 809) < 1e-6);
  assert.ok(Math.abs(frame!.centerY - 576) < 1e-6);
  assert.ok(Math.abs(frame!.width - 268) < 1e-6);
  assert.ok(Math.abs(frame!.height - 238) < 1e-6);
});

test("getMinimumAreaSelectionFrame finds an oriented frame for a tilted selection", () => {
  const tiltedLevelData = {
    ...STARTER_LEVEL_DATA,
    obstacles: [
      {
        id: "tilted-1",
        material: "wood" as const,
        position: { x: 300, y: 300 },
        size: { width: 120, height: 30 },
        angle: Math.PI / 4,
      },
      {
        id: "tilted-2",
        material: "wood" as const,
        position: { x: 420, y: 420 },
        size: { width: 120, height: 30 },
        angle: Math.PI / 4,
      },
    ],
    enemies: [],
  };

  const axisAlignedFrame = getSelectionFrame(tiltedLevelData, ["tilted-1", "tilted-2"], 0);
  const minimumAreaFrame = getMinimumAreaSelectionFrame(tiltedLevelData, ["tilted-1", "tilted-2"]);

  assert.ok(axisAlignedFrame);
  assert.ok(minimumAreaFrame);
  assert.ok(minimumAreaFrame!.width * minimumAreaFrame!.height < axisAlignedFrame!.width * axisAlignedFrame!.height);
  assert.ok(Math.abs(minimumAreaFrame!.rotation - (Math.PI / 4)) < 0.03);
});

test("getSelectionFrameFromHandle keeps the opposite corner fixed while resizing", () => {
  const nextFrame = getSelectionFrameFromHandle(
    { centerX: 664, centerY: 609, width: 144, height: 202, rotation: 0 },
    "top-left",
    { x: 592, y: 609 },
  );

  assert.deepEqual(nextFrame, {
    centerX: 664,
    centerY: 659.5,
    width: 144,
    height: 101,
    rotation: 0,
  });
});

test("scaleEntitiesFromSelectionBounds scales group positions and sizes from the dragged corner", () => {
  const snapshot = getGroupTransformSnapshot(
    STARTER_LEVEL_DATA,
    ["obstacle-glass-panel", "obstacle-glass-top"],
  );
  assert.ok(snapshot);
  const frame = getSelectionFrame(STARTER_LEVEL_DATA, ["obstacle-glass-panel", "obstacle-glass-top"], 0);
  assert.ok(frame);
  const nextFrame = getSelectionFrameFromHandle(frame!, "top-left", { x: 592, y: 609 });

  const nextLevelData = scaleEntitiesFromSelectionBounds(
    STARTER_LEVEL_DATA,
    snapshot!,
    frame!,
    nextFrame,
  );
  const nextPanel = nextLevelData.obstacles.find((candidate) => candidate.id === "obstacle-glass-panel");
  const nextTop = nextLevelData.obstacles.find((candidate) => candidate.id === "obstacle-glass-top");

  assert.equal(nextPanel?.position.x, 664);
  assert.equal(nextPanel?.position.y, 675);
  assert.equal(nextPanel?.size.width, 40);
  assert.equal(nextPanel?.size.height, 70);
  assert.equal(nextTop?.position.x, 664);
  assert.equal(nextTop?.position.y, 614);
  assert.equal(nextTop?.size.width, 144);
  assert.equal(nextTop?.size.height, 10);
});

test("scaleEntitiesFromSelectionBounds rejects scales that would push the group outside the canvas", () => {
  const snapshot = getGroupTransformSnapshot(
    STARTER_LEVEL_DATA,
    ["obstacle-glass-panel", "obstacle-glass-top"],
  );
  assert.ok(snapshot);
  const frame = getSelectionFrame(STARTER_LEVEL_DATA, ["obstacle-glass-panel", "obstacle-glass-top"], 0);
  assert.ok(frame);

  const nextLevelData = scaleEntitiesFromSelectionBounds(
    STARTER_LEVEL_DATA,
    snapshot!,
    frame!,
    { ...frame!, centerX: frame!.centerX - 520, width: frame!.width * 12 },
  );

  assert.equal(nextLevelData, STARTER_LEVEL_DATA);
});

test("rotateEntitiesAroundSelectionCenter rotates selected entities around the group center", () => {
  const snapshot = getGroupTransformSnapshot(
    STARTER_LEVEL_DATA,
    ["obstacle-glass-panel", "enemy-1"],
  );
  assert.ok(snapshot);

  const frame = getSelectionFrame(STARTER_LEVEL_DATA, ["obstacle-glass-panel", "enemy-1"], 0);
  assert.ok(frame);
  const nextLevelData = rotateEntitiesAroundSelectionCenter(
    STARTER_LEVEL_DATA,
    snapshot!,
    { x: frame!.centerX, y: frame!.centerY },
    Math.PI / 2,
  );
  const nextObstacle = nextLevelData.obstacles.find((candidate) => candidate.id === "obstacle-glass-panel");
  const nextEnemy = nextLevelData.enemies.find((candidate) => candidate.id === "enemy-1");

  assert.equal(nextObstacle?.position.x, 745);
  assert.equal(nextObstacle?.position.y, 467);
  assert.equal(nextObstacle?.angle, Math.PI / 2);
  assert.equal(nextEnemy?.position.x, 915);
  assert.equal(nextEnemy?.position.y, 667);
});

test("rotateEntitiesAroundSelectionCenter rejects rotations that would push the group outside the canvas", () => {
  const snapshot = getGroupTransformSnapshot(
    STARTER_LEVEL_DATA,
    ["obstacle-stone-block", "enemy-2"],
  );
  assert.ok(snapshot);

  const frame = getSelectionFrame(STARTER_LEVEL_DATA, ["obstacle-stone-block", "enemy-2"], 0);
  assert.ok(frame);
  const nextLevelData = rotateEntitiesAroundSelectionCenter(
    STARTER_LEVEL_DATA,
    snapshot!,
    { x: frame!.centerX, y: frame!.centerY },
    Math.PI / 2,
  );

  assert.equal(nextLevelData, STARTER_LEVEL_DATA);
});

test("rotateEntitiesAroundSelectionCenter normalizes obstacle angles after rotation", () => {
  const snapshot = getGroupTransformSnapshot(
    {
      ...STARTER_LEVEL_DATA,
      obstacles: STARTER_LEVEL_DATA.obstacles.map((obstacle) =>
        obstacle.id === "obstacle-glass-panel"
          ? { ...obstacle, angle: Math.PI * 1.5 }
          : obstacle,
      ),
    },
    ["obstacle-glass-panel", "enemy-1"],
  );
  assert.ok(snapshot);

  const frame = getSelectionFrame(
    {
      ...STARTER_LEVEL_DATA,
      obstacles: STARTER_LEVEL_DATA.obstacles.map((obstacle) =>
        obstacle.id === "obstacle-glass-panel"
          ? { ...obstacle, angle: Math.PI * 1.5 }
          : obstacle,
      ),
    },
    ["obstacle-glass-panel", "enemy-1"],
    0,
  );
  assert.ok(frame);

  const nextLevelData = rotateEntitiesAroundSelectionCenter(
    {
      ...STARTER_LEVEL_DATA,
      obstacles: STARTER_LEVEL_DATA.obstacles.map((obstacle) =>
        obstacle.id === "obstacle-glass-panel"
          ? { ...obstacle, angle: Math.PI * 1.5 }
          : obstacle,
      ),
    },
    snapshot!,
    { x: frame!.centerX, y: frame!.centerY },
    Math.PI,
  );

  const nextObstacle = nextLevelData.obstacles.find((candidate) => candidate.id === "obstacle-glass-panel");
  assert.ok(nextObstacle);
  assert.equal(nextObstacle!.angle, Math.PI / 2);
});
