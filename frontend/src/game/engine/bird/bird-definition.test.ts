import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBirdQueue,
  birdDefinitionFromUpgradeState,
  DEFAULT_BIRD_DEFINITION,
} from "./bird-definition.js";

test("legacy basic inventory uses the selected bird for every slot", () => {
  const selectedBird = {
    ...DEFAULT_BIRD_DEFINITION,
    birdType: "bird-design-0001",
    name: "闪电鸟",
    fillColor: "#f59e0b",
    source: "designer" as const,
  };

  const queue = buildBirdQueue({ basic: 3 }, selectedBird);
  assert.equal(queue.length, 3);
  assert.ok(queue.every((bird) => bird.birdType === "bird-design-0001"));
  assert.equal(queue[0]?.combatProfile.attack, selectedBird.combatProfile.attack);
});

test("explicit inventory entries preserve per-type slots", () => {
  const queue = buildBirdQueue(
    { basic: 1, split: 2 },
    DEFAULT_BIRD_DEFINITION,
  );

  assert.deepEqual(
    queue.map((bird) => bird.birdType),
    ["basic", "split", "split"],
  );
});

test("preparation stats map into combat profile", () => {
  const definition = birdDefinitionFromUpgradeState({
    birdType: "bird-design-0001",
    name: "闪电鸟",
    summary: "demo",
    previewImageUrl: "data:image/svg+xml,",
    level: 2,
    maxLevel: 10,
    tier: 2,
    maxTier: 3,
    stats: { attack: 108, impact: 96, speed: 65 },
    skillName: "精准冲击",
    skillDescription: "demo",
    nextTierSkillPreview: null,
    nextCostCoins: 100,
    nextCostFragments: 1,
    source: "designer",
    authorId: "designer-1",
  });

  assert.equal(definition.combatProfile.attack, 108);
  assert.equal(definition.combatProfile.tier, 2);
  assert.equal(definition.source, "designer");
});
