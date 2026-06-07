import test from "node:test";
import assert from "node:assert/strict";
import Matter from "matter-js";
import type { GameBody } from "../types.js";
import { SLINGSHOT_X, SLINGSHOT_Y, BIRD_RADIUS } from "../constants.js";
import { COLLISION_GROUP_FREE_FALL, COLLISION_MASK_DYNAMIC_FULL, getBlockEntity, setRenderKind } from "./config.js";
import {
  enforceStructureSupport,
  hasPhysicalSupportBelow,
  isInFreeFall,
  markBirdContactSupport,
  releaseBirdContactSupport,
  releaseStructureSupport,
} from "./physics.js";
import { SKILL_TEST_LEVEL_DATA } from "../../../shared/levels/skill-test-level.js";
import { createGameSession } from "./index.js";
import { FIXED_TIMESTEP_MS } from "./config.js";
import {
  createPigBesideWoodDropLevel,
  createSoloPigDropLevel,
  createStackedWoodDropLevel,
} from "./test-levels.js";

const stepFrames = (session: ReturnType<typeof createGameSession>, frames: number) => {
  for (let index = 0; index < frames; index += 1) {
    session.step(FIXED_TIMESTEP_MS);
  }
};

const findPig = (session: ReturnType<typeof createGameSession>) =>
  session.engine.world.bodies.find((body) => (body as GameBody).renderKind === "pig") as GameBody | undefined;

test("solo pig and pig beside wood fall at the same rate during free fall", () => {
  const soloSession = createGameSession(createSoloPigDropLevel());
  const pairedSession = createGameSession(createPigBesideWoodDropLevel());

  stepFrames(soloSession, 36);
  stepFrames(pairedSession, 36);

  const soloPig = findPig(soloSession);
  const pairedPig = findPig(pairedSession);
  assert.ok(soloPig);
  assert.ok(pairedPig);
  assert.ok(isInFreeFall(soloPig));
  assert.ok(isInFreeFall(pairedPig));

  assert.ok(Math.abs(soloPig.velocity.y - pairedPig.velocity.y) < 0.12);
  assert.ok(Math.abs(soloPig.position.y - pairedPig.position.y) < 4);
});

test("free-falling dynamics ignore each other until landing settles", () => {
  const session = createGameSession(createPigBesideWoodDropLevel());
  stepFrames(session, 20);

  const pig = findPig(session);
  const block = session.engine.world.bodies.find((body) => (body as GameBody).renderKind === "block") as GameBody | undefined;
  assert.ok(pig);
  assert.ok(block);
  assert.equal(pig.collisionFilter.group, COLLISION_GROUP_FREE_FALL);
  assert.equal(block.collisionFilter.group, COLLISION_GROUP_FREE_FALL);
  assert.equal(pig.collisionFilter.mask, COLLISION_MASK_DYNAMIC_FULL);
  assert.equal(block.collisionFilter.mask, COLLISION_MASK_DYNAMIC_FULL);
});

test("beginDrag stays blocked until the world finishes initial settling", () => {
  const session = createGameSession(createSoloPigDropLevel());

  stepFrames(session, 1);
  assert.equal(session.beginDrag(SLINGSHOT_X, SLINGSHOT_Y), false);

  stepFrames(session, 420);
  assert.equal(session.beginDrag(SLINGSHOT_X, SLINGSHOT_Y), false);
  assert.equal(session.selectBird("basic"), true);
  assert.equal(session.beginDrag(SLINGSHOT_X, SLINGSHOT_Y), true);

  session.destroy();
});

test("settled structures stay stable after world priming", () => {
  const session = createGameSession(createPigBesideWoodDropLevel());
  stepFrames(session, 420);
  assert.equal(session.selectBird("basic"), true);

  const block = session.engine.world.bodies.find((body) => (body as GameBody).renderKind === "block") as GameBody | undefined;
  assert.ok(block);
  const startY = block.position.y;

  stepFrames(session, 180);

  assert.ok(Math.abs(block.position.y - startY) < 2.5);
  assert.ok(block.speed < 0.35);

  session.destroy();
});

test("stacked blocks settle without overlapping after the base lands", () => {
  const session = createGameSession(createStackedWoodDropLevel());
  stepFrames(session, 420);

  const blocks = session.engine.world.bodies.filter((body) => (body as GameBody).renderKind === "block") as GameBody[];
  assert.equal(blocks.length, 2);

  const sorted = [...blocks].sort((left, right) => left.position.y - right.position.y);
  const base = sorted[0];
  const top = sorted[1];
  assert.ok(base);
  assert.ok(top);

  const baseHalfHeight = (base.bounds.max.y - base.bounds.min.y) / 2;
  const topHalfHeight = (top.bounds.max.y - top.bounds.min.y) / 2;
  const verticalGap = top.position.y - base.position.y;
  const expectedRestGap = baseHalfHeight + topHalfHeight;
  assert.ok(Math.abs(verticalGap - expectedRestGap) < 6, `expected stacked rest gap ~${expectedRestGap}, got ${verticalGap}`);

  session.destroy();
});

test("losing lower support triggers collapse of blocks above", () => {
  const session = createGameSession(createStackedWoodDropLevel());
  stepFrames(session, 420);

  const blocks = session.engine.world.bodies.filter((body) => (body as GameBody).renderKind === "block") as GameBody[];
  const sorted = [...blocks].sort((left, right) => left.position.y - right.position.y);
  const upper = sorted[0];
  const bottom = sorted[1];
  assert.ok(upper);
  assert.ok(bottom);

  const upperStartY = upper.position.y;
  const bottomEntity = getBlockEntity(bottom);
  assert.ok(bottomEntity);
  bottomEntity.state = "cracking";
  bottomEntity.pendingRemoval = true;

  releaseStructureSupport(bottom, session.engine.world.bodies as GameBody[]);
  stepFrames(session, 45);

  assert.equal(bottom.isSensor, true);
  assert.ok(upper.position.y > upperStartY + 6, "upper block should fall after lower support is lost");

  session.destroy();
});

test("skill test tower collapses through multiple levels when base support is lost", () => {
  const session = createGameSession({ levelData: SKILL_TEST_LEVEL_DATA });
  stepFrames(session, 420);

  const blocks = session.engine.world.bodies.filter((body) => (body as GameBody).renderKind === "block") as GameBody[];
  const towerBase = blocks.find((body) => Math.abs(body.position.x - 691.2) < 2 && Math.abs(body.position.y - 456.1) < 2);
  const towerUpper = blocks.filter((body) => Math.abs(body.position.x - 691.2) < 40 && body.position.y < 420);
  assert.ok(towerBase);
  assert.ok(towerUpper.length >= 2);

  const upperStartY = Math.min(...towerUpper.map((body) => body.position.y));
  const bottomEntity = getBlockEntity(towerBase);
  assert.ok(bottomEntity);
  bottomEntity.state = "cracking";
  bottomEntity.pendingRemoval = true;
  releaseStructureSupport(towerBase, session.engine.world.bodies as GameBody[]);

  stepFrames(session, 90);

  const maxUpperY = Math.max(...towerUpper.map((body) => body.position.y));
  assert.ok(maxUpperY > upperStartY + 20, "upper tower segments should cascade downward");

  session.destroy();
});

test("bird removal releases contact support and triggers upper structure collapse", () => {
  const { Bodies, Body, World } = Matter;
  const session = createGameSession(createStackedWoodDropLevel());
  stepFrames(session, 420);

  const blocks = session.engine.world.bodies.filter((body) => (body as GameBody).renderKind === "block") as GameBody[];
  const sorted = [...blocks].sort((left, right) => left.position.y - right.position.y);
  const bottom = sorted[0];
  const upper = sorted[1];
  assert.ok(bottom);
  assert.ok(upper);

  const bird = setRenderKind(
    Bodies.circle(upper.position.x, bottom.bounds.min.y - BIRD_RADIUS, BIRD_RADIUS, {
      restitution: 0.18,
      friction: 0.8,
      density: 0.004,
    }),
    "bird",
  );
  Body.setVelocity(bird, { x: 0, y: 0 });
  World.add(session.engine.world, bird);

  const upperHalfHeight = upper.position.y - upper.bounds.min.y;
  Body.setPosition(upper, {
    x: upper.position.x,
    y: bird.bounds.min.y - upperHalfHeight,
  });
  markBirdContactSupport(bird, upper);
  assert.equal(upper.plugin.birdSupportFrom, bird.id);

  bottom.destroyed = true;
  World.remove(session.engine.world, bottom);

  const liveBodies = () => session.engine.world.bodies as GameBody[];
  stepFrames(session, 24);
  assert.ok(hasPhysicalSupportBelow(upper, liveBodies()));

  const upperStartY = upper.position.y;
  releaseBirdContactSupport(bird, liveBodies());
  bird.destroyed = true;
  World.remove(session.engine.world, bird);

  stepFrames(session, 45);
  assert.ok(
    upper.plugin.supportCollapse || upper.position.y > upperStartY + 6,
    "upper block should collapse after bird contact support is released",
  );

  session.destroy();
});

test("auto-finish shot clears bird support and collapses structures after teleport", () => {
  const { Body, World } = Matter;
  const session = createGameSession(createStackedWoodDropLevel());
  stepFrames(session, 420);

  const blocks = session.engine.world.bodies.filter((body) => (body as GameBody).renderKind === "block") as GameBody[];
  const sorted = [...blocks].sort((left, right) => left.position.y - right.position.y);
  const bottom = sorted[0];
  const upper = sorted[1];
  const bird = session.engine.world.bodies.find((body) => (body as GameBody).renderKind === "bird") as GameBody | undefined;
  assert.ok(bottom);
  assert.ok(upper);
  assert.ok(bird);

  Body.setPosition(bird, { x: upper.position.x, y: bottom.bounds.min.y - BIRD_RADIUS });
  Body.setStatic(bird, false);
  const upperHalfHeight = upper.position.y - upper.bounds.min.y;
  Body.setPosition(upper, {
    x: upper.position.x,
    y: bird.bounds.min.y - upperHalfHeight,
  });
  markBirdContactSupport(bird, upper);
  assert.equal(upper.plugin.birdSupportFrom, bird.id);
  bottom.destroyed = true;
  World.remove(session.engine.world, bottom);

  const liveBodies = () => session.engine.world.bodies as GameBody[];
  const upperStartY = upper.position.y;
  releaseBirdContactSupport(bird, liveBodies());
  Body.setPosition(bird, { x: SLINGSHOT_X, y: SLINGSHOT_Y });
  Body.setStatic(bird, true);
  enforceStructureSupport(liveBodies());

  assert.equal(upper.plugin.birdSupportFrom, undefined);
  assert.equal(hasPhysicalSupportBelow(upper, liveBodies()), false);

  stepFrames(session, 45);
  assert.ok(
    upper.plugin.supportCollapse || upper.position.y > upperStartY + 6,
    "structures should collapse when settled bird is auto-removed from the field",
  );

  session.destroy();
});
