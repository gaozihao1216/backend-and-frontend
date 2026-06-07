import Matter from "matter-js";
import {
  getPigDamageMultiplier,
  getStructureDamageMultiplier,
} from "../combat-profile.js";
import { applyDamageToBody, getDamageableSnapshot } from "../damageable.js";
import { PIG_DAMAGE_FACTOR } from "../constants.js";
import type { GameBody } from "../types.js";
import { getBlockEntity, updateDamageVisuals } from "../game-session/config.js";
import { outwardDirection } from "./area-query.js";

const { Body, Vector, Sleeping } = Matter;

export type CombatEffects = {
  applyStructureDamage: (target: GameBody, amount: number, attacker: GameBody | null) => void;
  applyPigDamage: (target: GameBody, amount: number, attacker: GameBody | null) => void;
  applyRadialImpulse: (
    bodies: GameBody[],
    center: { x: number; y: number },
    radius: number,
    impulse: number,
  ) => void;
  applyDirectionalImpulse: (
    bodies: GameBody[],
    center: { x: number; y: number },
    direction: { x: number; y: number },
    impulse: number,
  ) => void;
};

export type CombatEffectsDeps = {
  removeBody: (body: GameBody) => void;
};

export const createCombatEffects = (deps: CombatEffectsDeps): CombatEffects => {
  const applyStructureDamage = (target: GameBody, amount: number, attacker: GameBody | null) => {
    if (target.renderKind !== "block" || amount <= 0) {
      return;
    }

    const snapshot = getDamageableSnapshot(target);
    const blockEntity = getBlockEntity(target);
    if (!snapshot || snapshot.isTerminal || !blockEntity) {
      return;
    }

    const multiplier = getStructureDamageMultiplier(attacker, "bird");
    const damage = amount * multiplier;
    const remainingHp = applyDamageToBody(target, damage, blockEntity);
    updateDamageVisuals(target);
    if (remainingHp !== null && remainingHp <= 0) {
      deps.removeBody(target);
    }
  };

  const applyPigDamage = (target: GameBody, amount: number, attacker: GameBody | null) => {
    if (target.renderKind !== "pig" || amount <= 0) {
      return;
    }

    const snapshot = getDamageableSnapshot(target);
    if (!snapshot || snapshot.isTerminal) {
      return;
    }

    const multiplier = getPigDamageMultiplier(attacker, "bird");
    const damage = amount * PIG_DAMAGE_FACTOR * multiplier;
    const remainingHp = applyDamageToBody(target, damage, null);
    if (remainingHp !== null && remainingHp <= 0) {
      deps.removeBody(target);
    }
  };

  const applyRadialImpulse = (
    bodies: GameBody[],
    center: { x: number; y: number },
    radius: number,
    impulse: number,
  ) => {
    for (const body of bodies) {
      if (body.destroyed || body.isStatic) {
        continue;
      }

      const distance = Vector.magnitude(Vector.sub(body.position, center));
      if (distance > radius) {
        continue;
      }

      const direction = outwardDirection(center, body.position);
      const falloff = 1 - Math.min(1, distance / Math.max(radius, 1));
      Body.applyForce(body, body.position, Vector.mult(direction, impulse * falloff));
      Sleeping.set(body, false);
    }
  };

  const applyDirectionalImpulse = (
    bodies: GameBody[],
    center: { x: number; y: number },
    direction: { x: number; y: number },
    impulse: number,
  ) => {
    const normal = Vector.normalise(direction);
    for (const body of bodies) {
      if (body.destroyed || body.isStatic) {
        continue;
      }

      Body.applyForce(body, body.position, Vector.mult(normal, impulse));
      Sleeping.set(body, false);
    }
  };

  return {
    applyStructureDamage,
    applyPigDamage,
    applyRadialImpulse,
    applyDirectionalImpulse,
  };
};
