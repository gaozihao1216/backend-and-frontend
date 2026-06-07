import Matter from "matter-js";
import { BIRD_RADIUS } from "../constants.js";
import type { BirdDefinition } from "../bird-definition.js";
import type { GameBody } from "../types.js";
import {
  applyCombatProfileToBird,
  getAttackerProfile,
} from "../combat-profile.js";
import {
  attachGameEntity,
  setRenderKind,
} from "../game-session/config.js";
import { applyBirdCollisionFilter } from "../game-session/physics.js";
import type { SkillSpec } from "./skill-spec.js";
import {
  distanceBetween,
  getBodiesInRadius,
  getForwardConeBodies,
  outwardDirection,
  radialFalloff,
} from "./area-query.js";
import type { CombatEffects } from "./combat-effects.js";
import { appendStatusEffect, createBurnEffect, createPoisonEffect } from "./status-effects.js";

const { Bodies, Body, Vector, Sleeping } = Matter;

export type SkillExecutionContext = {
  nowMs: number;
  bird: GameBody;
  birdDefinition: BirdDefinition;
  bodies: GameBody[];
  combat: CombatEffects;
  addBody: (body: GameBody) => void;
  removeBody: (body: GameBody) => void;
  pushVisual: (visual: SkillVisualEffect) => void;
};

export type SkillVisualEffect = {
  id: string;
  kind: SkillSpec["type"] | "bomb_blast";
  x: number;
  y: number;
  radius: number;
  progress: number;
  expiresAtMs: number;
};

export type PendingBombDrop = {
  id: string;
  body: GameBody;
  blastRadius: number;
  structureDamage: number;
  pigDamage: number;
  sourceBird: GameBody;
};

export type BalloonPushState = {
  startedAtMs: number;
  expandDurationMs: number;
  maxRadiusScale: number;
  pushForce: number;
  structureDamage: number;
  pigDamage: number;
  peakDamageApplied: boolean;
};

export type SpeedBoostState = {
  expiresAtMs: number;
  velocityMultiplier: number;
};

let visualCounter = 0;
const nextVisualId = () => `skill-visual-${visualCounter++}`;

const pushTimedVisual = (
  ctx: SkillExecutionContext,
  kind: SkillVisualEffect["kind"],
  center: { x: number; y: number },
  radius: number,
  durationMs: number,
) => {
  ctx.pushVisual({
    id: nextVisualId(),
    kind,
    x: center.x,
    y: center.y,
    radius,
    progress: 0,
    expiresAtMs: ctx.nowMs + durationMs,
  });
};

export const executeSkillSpec = (
  spec: SkillSpec,
  ctx: SkillExecutionContext,
): { removeBird?: boolean; balloonState?: BalloonPushState; speedBoost?: SpeedBoostState; pendingBombs?: PendingBombDrop[] } => {
  switch (spec.type) {
    case "speed_boost":
      return executeSpeedBoost(spec, ctx);
    case "split":
      return executeSplit(spec, ctx);
    case "balloon_push":
      return executeBalloonPush(spec, ctx);
    case "vertical_bomb_drop":
      return executeVerticalBombDrop(spec, ctx);
    case "forward_shockwave":
      return executeForwardShockwave(spec, ctx);
    case "radial_shockwave":
      return executeRadialShockwave(spec, ctx);
    case "point_blast":
      return executePointBlast(spec, ctx);
    case "lightning_storm":
      return executeLightningStorm(spec, ctx);
    case "burn_aura":
      return executeBurnAura(spec, ctx);
    case "poison_aura":
      return executePoisonAura(spec, ctx);
    default:
      return {};
  }
};

const executeSpeedBoost = (
  spec: Extract<SkillSpec, { type: "speed_boost" }>,
  ctx: SkillExecutionContext,
) => {
  const velocity = ctx.bird.velocity;
  Body.setVelocity(ctx.bird, Vector.mult(velocity, spec.velocityMultiplier));
  pushTimedVisual(ctx, "speed_boost", ctx.bird.position, BIRD_RADIUS * 2.2, 220);

  if (!spec.durationMs) {
    return {};
  }

  return {
    speedBoost: {
      expiresAtMs: ctx.nowMs + spec.durationMs,
      velocityMultiplier: spec.velocityMultiplier,
    },
  };
};

const executeSplit = (
  spec: Extract<SkillSpec, { type: "split" }>,
  ctx: SkillExecutionContext,
) => {
  const entity = ctx.bird.plugin.gameEntity;
  if (entity?.kind !== "bird") {
    return {};
  }

  const baseSpeed = Math.max(0.001, Vector.magnitude(ctx.bird.velocity));
  const baseAngle = Math.atan2(ctx.bird.velocity.y, ctx.bird.velocity.x);
  const spreadRad = (spec.spreadAngleDeg * Math.PI) / 180;
  const childSpeed = baseSpeed * spec.childSpeedRatio;
  const centerIndex = (spec.childCount - 1) / 2;

  for (let index = 0; index < spec.childCount; index += 1) {
    const angleOffset = (index - centerIndex) * (spreadRad / Math.max(spec.childCount - 1, 1));
    const angle = baseAngle + angleOffset;
    const child = setRenderKind(
      Bodies.circle(ctx.bird.position.x, ctx.bird.position.y, BIRD_RADIUS, {
        restitution: 0.025,
        friction: 0.8,
        frictionAir: 0.018,
        density: 0.0025,
        slop: 0.01,
      }),
      "bird",
    );

    attachGameEntity(child, {
      kind: "bird",
      combatProfile: entity.combatProfile,
      birdType: entity.birdType,
      name: entity.name,
      fillColor: entity.fillColor,
    });
    applyCombatProfileToBird(child, entity.combatProfile);
    applyBirdCollisionFilter(child);
    Body.setVelocity(child, {
      x: Math.cos(angle) * childSpeed,
      y: Math.sin(angle) * childSpeed,
    });
    ctx.addBody(child);
  }

  pushTimedVisual(ctx, "split", ctx.bird.position, BIRD_RADIUS * 2.5, 180);
  return { removeBird: true };
};

const executeBalloonPush = (
  spec: Extract<SkillSpec, { type: "balloon_push" }>,
  ctx: SkillExecutionContext,
) => ({
  balloonState: {
    startedAtMs: ctx.nowMs,
    expandDurationMs: spec.expandDurationMs,
    maxRadiusScale: spec.maxRadiusScale,
    pushForce: spec.pushForce,
    structureDamage: spec.structureDamage,
    pigDamage: spec.pigDamage,
    peakDamageApplied: false,
  },
});

export const tickBalloonPush = (
  state: BalloonPushState,
  ctx: SkillExecutionContext,
  nowMs: number,
) => {
  const elapsed = nowMs - state.startedAtMs;
  const progress = Math.min(1, elapsed / state.expandDurationMs);
  const radius = BIRD_RADIUS * (1 + (state.maxRadiusScale - 1) * progress);
  const center = ctx.bird.position;

  pushTimedVisual(ctx, "balloon_push", center, radius, 40);

  const targets = getBodiesInRadius(ctx.bodies, center, radius, ["block", "pig"]);
  for (const target of targets) {
    if (target === ctx.bird || target.destroyed) {
      continue;
    }

    const direction = outwardDirection(center, target.position);
    Body.applyForce(target, target.position, Vector.mult(direction, state.pushForce * progress));
    Sleeping.set(target, false);
  }

  if (progress >= 1 && !state.peakDamageApplied) {
    state.peakDamageApplied = true;
    for (const target of targets) {
      if (target.renderKind === "block") {
        ctx.combat.applyStructureDamage(target, state.structureDamage, ctx.bird);
      }
      if (target.renderKind === "pig" && state.pigDamage > 0) {
        ctx.combat.applyPigDamage(target, state.pigDamage, ctx.bird);
      }
    }
  }

  return progress >= 1;
};

const executeVerticalBombDrop = (
  spec: Extract<SkillSpec, { type: "vertical_bomb_drop" }>,
  ctx: SkillExecutionContext,
) => {
  Body.applyForce(ctx.bird, ctx.bird.position, { x: 0, y: -spec.recoilImpulse });
  Sleeping.set(ctx.bird, false);

  const pendingBombs: PendingBombDrop[] = [];
  for (let index = 0; index < spec.bombCount; index += 1) {
    const offsetX = (index - (spec.bombCount - 1) / 2) * (spec.bombRadius * 2.4);
    const bomb = setRenderKind(
      Bodies.circle(ctx.bird.position.x + offsetX, ctx.bird.position.y - 8, spec.bombRadius, {
        restitution: 0.02,
        friction: 0.4,
        frictionAir: 0.01,
        density: 0.003,
        slop: 0.01,
      }),
      "bird",
    );
    bomb.plugin.skillProjectile = {
      kind: "vertical_bomb",
      blastRadius: spec.blastRadius,
      structureDamage: spec.structureDamage,
      pigDamage: spec.pigDamage,
      sourceBirdId: ctx.bird.id,
      spawnAtMs: ctx.nowMs + index * spec.dropIntervalMs,
      armed: spec.dropIntervalMs <= 0 || index === 0,
    };
    Body.setVelocity(bomb, { x: 0, y: 0 });
    Body.setStatic(bomb, true);
    pendingBombs.push({
      id: `bomb-${ctx.bird.id}-${index}`,
      body: bomb,
      blastRadius: spec.blastRadius,
      structureDamage: spec.structureDamage,
      pigDamage: spec.pigDamage,
      sourceBird: ctx.bird,
    });
  }

  pushTimedVisual(ctx, "vertical_bomb_drop", ctx.bird.position, spec.blastRadius, 260);
  return { pendingBombs };
};

export const tickPendingBombs = (
  pendingBombs: PendingBombDrop[],
  ctx: SkillExecutionContext,
  nowMs: number,
) => {
  const remaining: PendingBombDrop[] = [];

  for (const pending of pendingBombs) {
    const projectile = pending.body.plugin.skillProjectile;
    if (projectile?.kind !== "vertical_bomb") {
      continue;
    }

    if (!projectile.armed && nowMs >= projectile.spawnAtMs) {
      projectile.armed = true;
      Body.setStatic(pending.body, false);
      Body.setVelocity(pending.body, { x: 0, y: 8.5 });
      ctx.addBody(pending.body);
    }

    if (!projectile.armed) {
      remaining.push(pending);
      continue;
    }

    if (pending.body.destroyed) {
      continue;
    }

    if (pending.body.speed < 0.35 && pending.body.position.y > ctx.bird.position.y + 20) {
      detonateBomb(pending, ctx);
      ctx.removeBody(pending.body);
      continue;
    }

    if (pending.body.position.y > 620) {
      detonateBomb(pending, ctx);
      ctx.removeBody(pending.body);
      continue;
    }

    remaining.push(pending);
  }

  return remaining;
};

const detonateBomb = (pending: PendingBombDrop, ctx: SkillExecutionContext) => {
  const center = pending.body.position;
  pushTimedVisual(ctx, "bomb_blast", center, pending.blastRadius, 320);

  const targets = getBodiesInRadius(ctx.bodies, center, pending.blastRadius, ["block", "pig"]);
  ctx.combat.applyRadialImpulse(targets, center, pending.blastRadius, 0.02);

  for (const target of targets) {
    const distance = distanceBetween(center, target.position);
    const ratio = radialFalloff(distance, pending.blastRadius, 0.85);
    if (target.renderKind === "block") {
      ctx.combat.applyStructureDamage(target, pending.structureDamage * ratio, pending.sourceBird);
    }
    if (target.renderKind === "pig") {
      ctx.combat.applyPigDamage(target, pending.pigDamage * ratio, pending.sourceBird);
    }
  }
};

const executeForwardShockwave = (
  spec: Extract<SkillSpec, { type: "forward_shockwave" }>,
  ctx: SkillExecutionContext,
) => {
  const direction = ctx.bird.velocity;
  const targets = getForwardConeBodies(ctx.bodies, ctx.bird.position, direction, spec.length, spec.width);
  ctx.combat.applyDirectionalImpulse(targets, ctx.bird.position, direction, spec.impulse);

  for (const target of targets) {
    if (target.renderKind === "block") {
      ctx.combat.applyStructureDamage(target, spec.structureDamage, ctx.bird);
    }
    if (target.renderKind === "pig") {
      ctx.combat.applyPigDamage(target, spec.pigDamage, ctx.bird);
    }
  }

  pushTimedVisual(ctx, "forward_shockwave", ctx.bird.position, spec.width, 240);
  return {};
};

const executeRadialShockwave = (
  spec: Extract<SkillSpec, { type: "radial_shockwave" }>,
  ctx: SkillExecutionContext,
) => {
  const targets = getBodiesInRadius(ctx.bodies, ctx.bird.position, spec.radius, ["block", "pig"]);
  ctx.combat.applyRadialImpulse(targets, ctx.bird.position, spec.radius, spec.impulse);

  for (const target of targets) {
    const ratio = radialFalloff(distanceBetween(ctx.bird.position, target.position), spec.radius, 0.75);
    if (target.renderKind === "block") {
      ctx.combat.applyStructureDamage(target, spec.structureDamage * ratio, ctx.bird);
    }
    if (target.renderKind === "pig") {
      ctx.combat.applyPigDamage(target, spec.pigDamage * ratio, ctx.bird);
    }
  }

  pushTimedVisual(ctx, "radial_shockwave", ctx.bird.position, spec.radius, 280);
  return {};
};

const executePointBlast = (
  spec: Extract<SkillSpec, { type: "point_blast" }>,
  ctx: SkillExecutionContext,
) => {
  const center = ctx.bird.position;
  const targets = getBodiesInRadius(ctx.bodies, center, spec.radius, ["block", "pig"]);
  ctx.combat.applyRadialImpulse(targets, center, spec.radius, 0.024);

  for (const target of targets) {
    const ratio = radialFalloff(distanceBetween(center, target.position), spec.radius, spec.falloff);
    if (target.renderKind === "block") {
      ctx.combat.applyStructureDamage(target, spec.centerStructureDamage * ratio, ctx.bird);
    }
    if (target.renderKind === "pig") {
      ctx.combat.applyPigDamage(target, spec.centerPigDamage * ratio, ctx.bird);
    }
  }

  pushTimedVisual(ctx, "point_blast", center, spec.radius, 300);
  return {};
};

const executeLightningStorm = (
  spec: Extract<SkillSpec, { type: "lightning_storm" }>,
  ctx: SkillExecutionContext,
) => {
  const pigs = getBodiesInRadius(ctx.bodies, ctx.bird.position, spec.radius, ["pig"]);
  for (const pig of pigs) {
    ctx.combat.applyPigDamage(pig, spec.pigDamage, ctx.bird);
  }

  pushTimedVisual(ctx, "lightning_storm", ctx.bird.position, spec.radius, 360);
  return {};
};

const executeBurnAura = (
  spec: Extract<SkillSpec, { type: "burn_aura" }>,
  ctx: SkillExecutionContext,
) => {
  const blocks = getBodiesInRadius(ctx.bodies, ctx.bird.position, spec.radius, ["block"]);
  const effect = createBurnEffect(
    spec.durationMs,
    spec.tickIntervalMs,
    spec.damagePerTick,
    spec.woodMultiplier,
  );

  for (const block of blocks) {
    appendStatusEffect(block, effect);
  }

  pushTimedVisual(ctx, "burn_aura", ctx.bird.position, spec.radius, spec.durationMs);
  return {};
};

const executePoisonAura = (
  spec: Extract<SkillSpec, { type: "poison_aura" }>,
  ctx: SkillExecutionContext,
) => {
  const pigs = getBodiesInRadius(ctx.bodies, ctx.bird.position, spec.radius, ["pig"]);
  const effect = createPoisonEffect(spec.durationMs, spec.tickIntervalMs, spec.damagePerTick);

  for (const pig of pigs) {
    appendStatusEffect(pig, effect);
  }

  pushTimedVisual(ctx, "poison_aura", ctx.bird.position, spec.radius, spec.durationMs);
  return {};
};

export const getBirdSkillProfile = (bird: GameBody) => getAttackerProfile(bird);
