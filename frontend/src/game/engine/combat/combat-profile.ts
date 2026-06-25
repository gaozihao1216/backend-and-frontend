import Matter from "matter-js";
import type { GameBody, GameBodyKind } from "../core/types.js";

const { Body: MatterBody } = Matter;

export type CombatProfile = {
  attack: number;
  impact: number;
  speed: number;
  tier: number;
};

export const REFERENCE_COMBAT_PROFILE: CombatProfile = {
  attack: 100,
  impact: 80,
  speed: 60,
  tier: 1,
};

export const DEFAULT_COMBAT_PROFILE = REFERENCE_COMBAT_PROFILE;

const statRatio = (value: number, reference: number) =>
  reference <= 0 ? 1 : value / reference;

export const getImpactDamageScale = (profile: CombatProfile) =>
  statRatio(profile.impact, REFERENCE_COMBAT_PROFILE.impact);

export const getAttackDamageScale = (profile: CombatProfile) =>
  statRatio(profile.attack, REFERENCE_COMBAT_PROFILE.attack);

export const getTierDamageScale = (profile: CombatProfile) =>
  1 + Math.max(0, profile.tier - 1) * 0.05;

export const getAttackerProfile = (body: GameBody): CombatProfile | null => {
  if (body.renderKind !== "bird") {
    return null;
  }

  const entity = body.plugin.gameEntity;
  if (entity?.kind === "bird") {
    return entity.combatProfile;
  }

  return DEFAULT_COMBAT_PROFILE;
};

export const getStructureDamageMultiplier = (
  attacker: GameBody | null,
  attackerKind: GameBodyKind,
) => {
  if (attackerKind === "bird") {
    const profile = attacker
      ? (getAttackerProfile(attacker) ?? DEFAULT_COMBAT_PROFILE)
      : DEFAULT_COMBAT_PROFILE;
    return 1.1 * getImpactDamageScale(profile) * getTierDamageScale(profile);
  }

  if (attackerKind === "ground") {
    return 0.35;
  }

  return 0.7;
};

export const getPigDamageMultiplier = (
  attacker: GameBody | null,
  attackerKind: GameBodyKind,
) => {
  if (attackerKind === "bird") {
    const profile = attacker
      ? (getAttackerProfile(attacker) ?? DEFAULT_COMBAT_PROFILE)
      : DEFAULT_COMBAT_PROFILE;
    return 1.2 * getAttackDamageScale(profile) * getTierDamageScale(profile);
  }

  if (attackerKind === "block") {
    return 1;
  }

  return 0.45;
};

const BASE_BIRD_DENSITY = 0.0025;

export const applyCombatProfileToBird = (body: GameBody, profile: CombatProfile) => {
  const speedScale = statRatio(profile.speed, REFERENCE_COMBAT_PROFILE.speed);
  MatterBody.setDensity(body, BASE_BIRD_DENSITY / speedScale);
};
