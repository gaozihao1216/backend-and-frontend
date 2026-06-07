import { z } from "zod";

export const SkillTriggerSchema = z.literal("on_tap");
export type SkillTrigger = z.infer<typeof SkillTriggerSchema>;

export const SpeedBoostSpecSchema = z.object({
  type: z.literal("speed_boost"),
  velocityMultiplier: z.number().positive(),
  durationMs: z.number().int().positive().optional(),
});

export const SplitSpecSchema = z.object({
  type: z.literal("split"),
  childCount: z.number().int().min(2).max(8),
  spreadAngleDeg: z.number().min(0).max(180),
  childSpeedRatio: z.number().positive().max(1.5),
});

export const BalloonPushSpecSchema = z.object({
  type: z.literal("balloon_push"),
  expandDurationMs: z.number().int().positive(),
  maxRadiusScale: z.number().positive(),
  pushForce: z.number().positive(),
  structureDamage: z.number().nonnegative(),
  pigDamage: z.number().nonnegative().default(0),
});

export const VerticalBombDropSpecSchema = z.object({
  type: z.literal("vertical_bomb_drop"),
  bombCount: z.number().int().min(1).max(6),
  dropIntervalMs: z.number().int().nonnegative(),
  bombRadius: z.number().positive(),
  blastRadius: z.number().positive(),
  structureDamage: z.number().nonnegative(),
  pigDamage: z.number().nonnegative(),
  recoilImpulse: z.number().positive(),
});

export const ForwardShockwaveSpecSchema = z.object({
  type: z.literal("forward_shockwave"),
  length: z.number().positive(),
  width: z.number().positive(),
  impulse: z.number().positive(),
  structureDamage: z.number().nonnegative(),
  pigDamage: z.number().nonnegative(),
});

export const RadialShockwaveSpecSchema = z.object({
  type: z.literal("radial_shockwave"),
  radius: z.number().positive(),
  impulse: z.number().positive(),
  structureDamage: z.number().nonnegative(),
  pigDamage: z.number().nonnegative(),
});

export const PointBlastSpecSchema = z.object({
  type: z.literal("point_blast"),
  radius: z.number().positive(),
  centerStructureDamage: z.number().nonnegative(),
  centerPigDamage: z.number().nonnegative(),
  falloff: z.number().min(0).max(1),
});

export const LightningStormSpecSchema = z.object({
  type: z.literal("lightning_storm"),
  radius: z.number().positive(),
  pigDamage: z.number().nonnegative(),
});

export const BurnAuraSpecSchema = z.object({
  type: z.literal("burn_aura"),
  radius: z.number().positive(),
  durationMs: z.number().int().positive(),
  tickIntervalMs: z.number().int().positive(),
  damagePerTick: z.number().nonnegative(),
  woodMultiplier: z.number().positive(),
});

export const PoisonAuraSpecSchema = z.object({
  type: z.literal("poison_aura"),
  radius: z.number().positive(),
  durationMs: z.number().int().positive(),
  tickIntervalMs: z.number().int().positive(),
  damagePerTick: z.number().nonnegative(),
});

export const SkillSpecSchema = z.discriminatedUnion("type", [
  SpeedBoostSpecSchema,
  SplitSpecSchema,
  BalloonPushSpecSchema,
  VerticalBombDropSpecSchema,
  ForwardShockwaveSpecSchema,
  RadialShockwaveSpecSchema,
  PointBlastSpecSchema,
  LightningStormSpecSchema,
  BurnAuraSpecSchema,
  PoisonAuraSpecSchema,
]);

export type SkillSpec = z.infer<typeof SkillSpecSchema>;

export const BirdSkillStageSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  trigger: SkillTriggerSchema,
  specs: z.array(SkillSpecSchema).min(1),
  maxActivations: z.number().int().positive().optional(),
  cooldownMs: z.number().int().nonnegative().optional(),
});

export type BirdSkillStage = z.infer<typeof BirdSkillStageSchema>;

export const BirdSkillSetSchema = z.object({
  stages: z.array(BirdSkillStageSchema).min(1),
});

export type BirdSkillSet = z.infer<typeof BirdSkillSetSchema>;

export const resolveSkillStage = (skillSet: BirdSkillSet, tier: number): BirdSkillStage => {
  const index = Math.min(Math.max(tier, 1), skillSet.stages.length) - 1;
  return skillSet.stages[index] ?? skillSet.stages[0]!;
};
