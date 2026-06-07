import type { GameBody, ObstacleMaterial } from "../types.js";
import type { CombatEffects } from "./combat-effects.js";

export type BurnStatusEffect = {
  kind: "burn";
  remainingMs: number;
  tickAccumulatorMs: number;
  tickIntervalMs: number;
  damagePerTick: number;
  woodMultiplier: number;
  glassMultiplier: number;
  stoneMultiplier: number;
};

export type PoisonStatusEffect = {
  kind: "poison";
  remainingMs: number;
  tickAccumulatorMs: number;
  tickIntervalMs: number;
  damagePerTick: number;
};

export type StatusEffectInstance = BurnStatusEffect | PoisonStatusEffect;

const MATERIAL_BURN_MULTIPLIER: Record<ObstacleMaterial, keyof BurnStatusEffect> = {
  wood: "woodMultiplier",
  glass: "glassMultiplier",
  stone: "stoneMultiplier",
};

export const appendStatusEffect = (body: GameBody, effect: StatusEffectInstance) => {
  const current = body.plugin.statusEffects ?? [];
  body.plugin.statusEffects = [...current, effect];
};

export const createBurnEffect = (
  durationMs: number,
  tickIntervalMs: number,
  damagePerTick: number,
  woodMultiplier: number,
): BurnStatusEffect => ({
  kind: "burn",
  remainingMs: durationMs,
  tickAccumulatorMs: 0,
  tickIntervalMs,
  damagePerTick,
  woodMultiplier,
  glassMultiplier: 1,
  stoneMultiplier: 0.5,
});

export const createPoisonEffect = (
  durationMs: number,
  tickIntervalMs: number,
  damagePerTick: number,
): PoisonStatusEffect => ({
  kind: "poison",
  remainingMs: durationMs,
  tickAccumulatorMs: 0,
  tickIntervalMs,
  damagePerTick,
});

export const tickStatusEffects = (
  bodies: GameBody[],
  deltaMs: number,
  combat: CombatEffects,
  attacker: GameBody | null,
) => {
  for (const body of bodies) {
    if (body.destroyed || !body.plugin.statusEffects?.length) {
      continue;
    }

    const nextEffects: StatusEffectInstance[] = [];
    for (const effect of body.plugin.statusEffects) {
      const remainingMs = effect.remainingMs - deltaMs;
      if (remainingMs <= 0) {
        continue;
      }

      const tickAccumulatorMs = effect.tickAccumulatorMs + deltaMs;
      if (tickAccumulatorMs >= effect.tickIntervalMs) {
        if (effect.kind === "burn" && body.renderKind === "block") {
          const blockEntity = body.plugin.gameEntity;
          const material: ObstacleMaterial =
            blockEntity?.kind === "block" ? blockEntity.material : "wood";
          const multiplierKey = MATERIAL_BURN_MULTIPLIER[material];
          const multiplier = effect[multiplierKey] as number;
          combat.applyStructureDamage(body, effect.damagePerTick * multiplier, attacker);
        }

        if (effect.kind === "poison" && body.renderKind === "pig") {
          combat.applyPigDamage(body, effect.damagePerTick, attacker);
        }
      }

      nextEffects.push({
        ...effect,
        remainingMs,
        tickAccumulatorMs:
          tickAccumulatorMs >= effect.tickIntervalMs
            ? tickAccumulatorMs - effect.tickIntervalMs
            : tickAccumulatorMs,
      });
    }

    body.plugin.statusEffects = nextEffects;
  }
};

export const hasActiveBurn = (body: GameBody) =>
  body.plugin.statusEffects?.some((effect: StatusEffectInstance) => effect.kind === "burn") ?? false;

export const hasActivePoison = (body: GameBody) =>
  body.plugin.statusEffects?.some((effect: StatusEffectInstance) => effect.kind === "poison") ?? false;
