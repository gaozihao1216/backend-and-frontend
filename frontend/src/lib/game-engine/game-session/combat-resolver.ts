import Matter from "matter-js";
import type { Engine, IEventCollision, Vector as MatterVector } from "matter-js";
import {
  computeContactPointImpulse,
  computeEffectiveThickness,
  computeFractureResponse,
  computeVelocityPreservationRatio,
} from "../fracture.js";
import {
  getAttackerProfile,
  getPigDamageMultiplier,
  getStructureDamageMultiplier,
} from "../combat-profile.js";
import { applyDamageToBody, getDamageableSnapshot } from "../damageable.js";
import { MATERIAL_PARAMS } from "../materials.js";
import { MIN_DAMAGE_IMPULSE, PIG_DAMAGE_FACTOR } from "../constants.js";
import type { GameBody } from "../types.js";
import {
  getBlockEntity,
  getPairContactPoint,
  PAIR_IMPACT_COOLDOWN_MS,
  updateDamageVisuals,
} from "./config.js";

const { Body, Vector } = Matter;

export type CombatResolverDeps = {
  removeBody: (body: GameBody) => void;
  shouldApplyDamage: () => boolean;
  onStructureSupportLost?: (body: GameBody) => void;
};

export type CombatResolver = {
  handleCollisionStart: (event: IEventCollision<Engine>, nowMs: number) => void;
};

export const createCombatResolver = (deps: CombatResolverDeps): CombatResolver => {
  const recentPairImpacts = new Map<string, number>();

  const applyDamage = (body: GameBody, amount: number) => {
    const snapshot = getDamageableSnapshot(body);
    const blockEntity = getBlockEntity(body);
    if (!snapshot || snapshot.isTerminal) {
      return;
    }

    const remainingHp = applyDamageToBody(body, amount, blockEntity);
    updateDamageVisuals(body);
    if (remainingHp !== null && remainingHp <= 0) {
      deps.removeBody(body);
    }
  };

  const getPairKey = (bodyA: GameBody, bodyB: GameBody) =>
    (bodyA.id < bodyB.id ? `${bodyA.id}:${bodyB.id}` : `${bodyB.id}:${bodyA.id}`);

  const applyImpulseDampingToBird = (
    birdBody: GameBody,
    normal: MatterVector,
    rawImpulse: number,
    effectiveImpulse: number,
  ) => {
    if (birdBody.renderKind !== "bird" || rawImpulse <= 0) {
      return;
    }

    const velocityAlongNormal = Vector.dot(birdBody.velocity, normal);
    if (velocityAlongNormal >= 0) {
      return;
    }

    const preservedRatio = computeVelocityPreservationRatio(rawImpulse, effectiveImpulse);
    const tangentialVelocity = Vector.sub(birdBody.velocity, Vector.mult(normal, velocityAlongNormal));
    const adjustedNormalVelocity = velocityAlongNormal * preservedRatio;

    Body.setVelocity(birdBody, Vector.add(tangentialVelocity, Vector.mult(normal, adjustedNormalVelocity)));
  };

  const shouldUseFractureModel = (targetBody: GameBody, otherBody: GameBody) =>
    targetBody.renderKind === "block" && otherBody.renderKind === "bird";

  const triggerFracture = (
    targetBody: GameBody,
    otherBody: GameBody,
    impactImpulse: number,
    normal: MatterVector,
    nowMs: number,
  ) => {
    const entity = getBlockEntity(targetBody);
    if (!entity || entity.state === "cracking" || entity.state === "broken") {
      return false;
    }

    const material = MATERIAL_PARAMS[entity.material];
    const effectiveThickness = computeEffectiveThickness(targetBody, normal);
    const fracture = computeFractureResponse(material, effectiveThickness, impactImpulse);

    entity.hp = 0;
    entity.state = "cracking";
    entity.crackStartTime = nowMs;
    entity.breakDuration = fracture.breakDuration;
    entity.effectiveThickness = effectiveThickness;
    entity.pendingRemoval = true;
    entity.collisionCooldownUntil = nowMs + fracture.breakDuration;
    updateDamageVisuals(targetBody);
    deps.onStructureSupportLost?.(targetBody);

    if (otherBody.renderKind === "bird") {
      applyImpulseDampingToBird(otherBody, normal, impactImpulse, fracture.effectiveImpulse);
    } else if (targetBody.renderKind === "bird") {
      applyImpulseDampingToBird(targetBody, Vector.neg(normal), impactImpulse, fracture.effectiveImpulse);
    }

    return true;
  };

  const resolveStructureImpact = (
    targetBody: GameBody,
    otherBody: GameBody,
    impactImpulse: number,
    nowMs: number,
    normal: MatterVector,
  ) => {
    const entity = getBlockEntity(targetBody);
    if (!entity) {
      return;
    }

    if (entity.state === "cracking" || entity.state === "broken" || nowMs < entity.collisionCooldownUntil) {
      return;
    }

    const material = MATERIAL_PARAMS[entity.material];
    const attackerKind = otherBody.renderKind ?? "block";
    const multiplier = getStructureDamageMultiplier(
      otherBody.renderKind === "bird" ? otherBody : null,
      attackerKind,
    );
    const damage = impactImpulse * material.damageFactor * multiplier;

    if (shouldUseFractureModel(targetBody, otherBody) && impactImpulse >= material.fractureThreshold && damage >= entity.hp) {
      if (triggerFracture(targetBody, otherBody, impactImpulse, normal, nowMs)) {
        return;
      }
    }

    applyDamage(targetBody, damage);
    entity.collisionCooldownUntil = nowMs + 45;
  };

  const resolvePigImpact = (targetBody: GameBody, otherBody: GameBody, impactImpulse: number) => {
    const attackerKind = otherBody.renderKind ?? "block";
    const multiplier = getPigDamageMultiplier(
      otherBody.renderKind === "bird" ? otherBody : null,
      attackerKind,
    );
    applyDamage(targetBody, impactImpulse * PIG_DAMAGE_FACTOR * multiplier);
  };

  const handleCollisionStart = (event: IEventCollision<Engine>, nowMs: number) => {
    if (!deps.shouldApplyDamage()) {
      return;
    }

    for (const pair of event.pairs) {
      const bodyA = pair.bodyA as GameBody;
      const bodyB = pair.bodyB as GameBody;
      if (bodyA.destroyed || bodyB.destroyed) {
        continue;
      }

      const pairKey = getPairKey(bodyA, bodyB);
      const lastImpactAt = recentPairImpacts.get(pairKey) ?? -Infinity;
      if (nowMs - lastImpactAt < PAIR_IMPACT_COOLDOWN_MS) {
        continue;
      }

      const contactPoint = getPairContactPoint(pair, bodyA, pair.collision.normal);
      const impactImpulse = computeContactPointImpulse(bodyA, bodyB, pair.collision.normal, contactPoint);
      if (impactImpulse < MIN_DAMAGE_IMPULSE) {
        continue;
      }
      recentPairImpacts.set(pairKey, nowMs);

      if (bodyA.renderKind === "pig") {
        resolvePigImpact(bodyA, bodyB, impactImpulse);
      }
      if (bodyB.renderKind === "pig") {
        resolvePigImpact(bodyB, bodyA, impactImpulse);
      }

      if (bodyA.renderKind === "block") {
        resolveStructureImpact(bodyA, bodyB, impactImpulse, nowMs, pair.collision.normal);
      }
      if (bodyB.renderKind === "block") {
        resolveStructureImpact(bodyB, bodyA, impactImpulse, nowMs, Vector.neg(pair.collision.normal));
      }
    }
  };

  return { handleCollisionStart };
};

export const getBirdCombatProfile = (body: GameBody) => getAttackerProfile(body);
