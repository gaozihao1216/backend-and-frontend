import test from "node:test";
import assert from "node:assert/strict";
import type { GameBody } from "../types.js";
import { SLINGSHOT_X, SLINGSHOT_Y } from "../constants.js";
import { COLLISION_MASK_FREE_FALL } from "./config.js";
import { isInFreeFall } from "./physics.js";
import { createGameSession } from "./index.js";
import { FIXED_TIMESTEP_MS } from "./config.js";
import {
  createPigBesideWoodDropLevel,
  createSoloPigDropLevel,
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
  assert.equal(pig.collisionFilter.mask, COLLISION_MASK_FREE_FALL);
  assert.equal(block.collisionFilter.mask, COLLISION_MASK_FREE_FALL);
});

test("beginDrag stays blocked until the world finishes initial settling", () => {
  const session = createGameSession(createSoloPigDropLevel());

  stepFrames(session, 1);
  assert.equal(session.beginDrag(SLINGSHOT_X, SLINGSHOT_Y), false);

  stepFrames(session, 420);
  assert.equal(session.beginDrag(SLINGSHOT_X, SLINGSHOT_Y), true);

  session.destroy();
});

test("settled structures stay stable after world priming", () => {
  const session = createGameSession(createPigBesideWoodDropLevel());
  stepFrames(session, 420);
  assert.equal(session.beginDrag(SLINGSHOT_X, SLINGSHOT_Y), true);

  const block = session.engine.world.bodies.find((body) => (body as GameBody).renderKind === "block") as GameBody | undefined;
  assert.ok(block);
  const startY = block.position.y;

  stepFrames(session, 180);

  assert.ok(Math.abs(block.position.y - startY) < 2.5);
  assert.ok(block.speed < 0.35);

  session.destroy();
});
