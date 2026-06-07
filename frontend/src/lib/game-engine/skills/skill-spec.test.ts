import test from "node:test";
import assert from "node:assert/strict";
import { resolveSkillStage } from "./skill-spec.js";
import { BASIC_SKILLS, SPLIT_SKILLS, BOMB_SKILLS } from "../bird-definition.js";
import type { GameBody } from "../types.js";
import { distanceBetween, getBodiesInRadius, radialFalloff } from "./area-query.js";

test("resolveSkillStage picks tier stage", () => {
  assert.equal(resolveSkillStage(BASIC_SKILLS, 1).id, "basic-tier-1");
  assert.equal(resolveSkillStage(BASIC_SKILLS, 2).id, "basic-tier-2");
  assert.equal(resolveSkillStage(BASIC_SKILLS, 9).id, "basic-tier-3");
});

test("system birds expose on_tap skill templates", () => {
  assert.equal(SPLIT_SKILLS.stages[0]?.specs[0]?.type, "split");
  assert.equal(BOMB_SKILLS.stages[0]?.specs[0]?.type, "vertical_bomb_drop");
  assert.equal(BASIC_SKILLS.stages[0]?.specs[0]?.type, "balloon_push");
});

test("radial falloff decreases toward edge", () => {
  assert.equal(radialFalloff(0, 100, 0.8), 1);
  assert.ok(radialFalloff(100, 100, 0.8) < radialFalloff(20, 100, 0.8));
});

test("getBodiesInRadius filters by render kind", () => {
  const bodies = [
    {
      destroyed: false,
      isStatic: false,
      renderKind: "block",
      position: { x: 10, y: 0 },
      circleRadius: 0,
    },
    {
      destroyed: false,
      isStatic: false,
      renderKind: "pig",
      position: { x: 200, y: 0 },
      circleRadius: 20,
    },
  ] as unknown as GameBody[];

  const nearbyBlocks = getBodiesInRadius([...bodies], { x: 0, y: 0 }, 40, ["block"]);
  assert.equal(nearbyBlocks.length, 1);
  assert.equal(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});
