import test from "node:test";
import assert from "node:assert/strict";
import Matter from "matter-js";
import {
  computeCollisionImpulse,
  computeContactPointImpulse,
} from "./fracture.js";
import {
  DEFAULT_COMBAT_PROFILE,
  getAttackDamageScale,
  getImpactDamageScale,
  getPigDamageMultiplier,
  getStructureDamageMultiplier,
  REFERENCE_COMBAT_PROFILE,
} from "./combat-profile.js";
import { PIG_DAMAGE_FACTOR } from "./constants.js";

const { Bodies } = Matter;

const normal = { x: 0, y: -1 };

test("contact point impulse uses local velocity instead of center-of-mass speed", () => {
  const block = Bodies.rectangle(0, 0, 72, 72, { isStatic: true });
  const bird = Bodies.circle(0, -40, 18);

  Matter.Body.setVelocity(bird, { x: 0, y: 0 });
  Matter.Body.setAngularVelocity(bird, 2.5);

  const centerImpulse = computeCollisionImpulse(bird, block, normal);
  const edgeContactPoint = {
    x: bird.position.x + 18,
    y: bird.position.y,
  };
  const contactImpulse = computeContactPointImpulse(bird, block, normal, edgeContactPoint);

  assert.equal(centerImpulse, 0);
  assert.ok(contactImpulse > 0.5);
});

test("reference combat profile preserves legacy bird multipliers", () => {
  assert.equal(getImpactDamageScale(REFERENCE_COMBAT_PROFILE), 1);
  assert.equal(getAttackDamageScale(REFERENCE_COMBAT_PROFILE), 1);
  assert.equal(getStructureDamageMultiplier(null, "bird"), 1.1);
  assert.equal(getPigDamageMultiplier(null, "bird"), 1.2);
});

test("scaled combat profile adjusts pig and structure damage", () => {
  const heavyHitProfile = {
    ...DEFAULT_COMBAT_PROFILE,
    attack: 120,
    impact: 110,
  };

  assert.ok(getAttackDamageScale(heavyHitProfile) > 1);
  assert.ok(getImpactDamageScale(heavyHitProfile) > 1);

  const pigDamage = 10 * PIG_DAMAGE_FACTOR * getPigDamageMultiplier(null, "bird") * getAttackDamageScale(heavyHitProfile);
  const referencePigDamage = 10 * PIG_DAMAGE_FACTOR * 1.2;
  assert.ok(pigDamage > referencePigDamage);
});
