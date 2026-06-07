import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBirdPool } from "./bird-pool.js";
import { createBirdPoolTracker } from "./game-engine/bird-pool-session.js";
import { DEFAULT_BIRD_DEFINITION, listSystemBirdDefinitions } from "./game-engine/bird-definition.js";

test("legacy birdInventory basic maps to total-only pool", () => {
  const pool = normalizeBirdPool({ birdInventory: { basic: 4 } });
  assert.equal(pool.totalBirds, 4);
  assert.deepEqual(pool.allowedBirdTypes, []);
  assert.deepEqual(pool.caps, {});
});

test("legacy mixed inventory maps to allowed types with caps", () => {
  const pool = normalizeBirdPool({ birdInventory: { basic: 1, split: 2 } });
  assert.equal(pool.totalBirds, 3);
  assert.deepEqual(pool.allowedBirdTypes.sort(), ["basic", "split"]);
  assert.deepEqual(pool.caps, { basic: 1, split: 2 });
});

test("bird pool tracker lets player choose launch order freely", () => {
  const tracker = createBirdPoolTracker({
    totalBirds: 3,
    allowedBirdTypes: ["basic", "split"],
    caps: { basic: 2, split: 2 },
    catalog: listSystemBirdDefinitions(),
  });

  assert.equal(tracker.canSelect("basic"), true);
  assert.equal(tracker.canSelect("split"), true);
  tracker.consumeShot("split");
  tracker.consumeShot("basic");
  tracker.consumeShot("split");

  assert.equal(tracker.getShotsRemaining(), 0);
  assert.equal(tracker.canSelect("basic"), false);
  assert.equal(tracker.getSelectableBirds().length, 0);
});

test("empty allowed list accepts any catalog bird until total is exhausted", () => {
  const tracker = createBirdPoolTracker({
    totalBirds: 2,
    allowedBirdTypes: [],
    caps: {},
    catalog: [DEFAULT_BIRD_DEFINITION],
  });

  tracker.consumeShot("basic");
  assert.equal(tracker.canSelect("basic"), true);
  tracker.consumeShot("basic");
  assert.equal(tracker.canSelect("basic"), false);
});
