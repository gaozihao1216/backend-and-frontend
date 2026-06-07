import test from "node:test";
import assert from "node:assert/strict";
import type { GameBody } from "../types.js";
import { SLINGSHOT_X, SLINGSHOT_Y } from "../constants.js";
import { COLLISION_GROUP_FREE_FALL, COLLISION_MASK_DYNAMIC_FULL, getBlockEntity } from "./config.js";
import { isInFreeFall, releaseStructureSupport } from "./physics.js";
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
