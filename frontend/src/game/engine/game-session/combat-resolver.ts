import Matter from "matter-js";
import type { Engine, IEventCollision, Vector as MatterVector } from "matter-js";
import {
  computeContactPointImpulse,
  computeEffectiveThickness,
  computeFractureResponse,
  computeVelocityPreservationRatio,
} from "../combat/fracture.js";
import {
  getAttackerProfile,
  getPigDamageMultiplier,
  getStructureDamageMultiplier,
} from "../combat/combat-profile.js";
import { applyDamageToBody, getDamageableSnapshot } from "../combat/damageable.js";
import { MATERIAL_PARAMS } from "../combat/materials.js";
import { MIN_DAMAGE_IMPULSE, PIG_DAMAGE_FACTOR } from "../core/constants.js";
import type { GameBody } from "../core/types.js";
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

/**
 * 创建碰撞伤害结算器。
 *
 * Matter.js 只负责物理碰撞，这里把碰撞冲量转换为猪/结构的生命值变化，
 * 并处理木块碎裂、速度衰减和支撑失效等游戏规则。
 */
export const createCombatResolver = (deps: CombatResolverDeps): CombatResolver => {
  const recentPairImpacts = new Map<string, number>();

  // 所有伤害最终都从这里写入 body，保证死亡移除和视觉刷新路径一致。
  const applyDamage = (body: GameBody, amount: number) => {
    const snapshot = getDamageableSnapshot(body);
    const blockEntity = getBlockEntity(body);
    if (!snapshot || snapshot.isTerminal) {
      return;
    }

    const remainingHp = applyDamageToBody(body, amount, blockEntity);
    updateDamageVisuals(body);
    if (remainingHp !== null && remainingHp <= 0) {
      deps.onStructureSupportLost?.(body);
      deps.removeBody(body);
    }
  };

  // 同一对物体短时间内可能产生多次 collisionStart，需要用稳定 key 做冷却。
  const getPairKey = (bodyA: GameBody, bodyB: GameBody) =>
    (bodyA.id < bodyB.id ? `${bodyA.id}:${bodyB.id}` : `${bodyB.id}:${bodyA.id}`);

  // 鸟撞碎结构后保留一部分速度，避免“穿透式碎裂”让鸟的动量完全不合理。
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

  // 结构达到断裂条件时进入 cracking 动画期，真正移除交给 game-session 的帧循环。
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

  // 结构伤害会综合材料、攻击者类型和鸟类战斗属性。
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

  // 猪的伤害模型更简单，只按碰撞冲量和攻击者倍率结算。
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
