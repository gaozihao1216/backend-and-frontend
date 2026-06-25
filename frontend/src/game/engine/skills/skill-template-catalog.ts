import type { SkillSpec } from "./skill-spec.js";

export type SkillTemplateDefinition = {
  type: SkillSpec["type"];
  label: string;
  description: string;
  defaults: SkillSpec;
};

export const SKILL_TEMPLATE_CATALOG: SkillTemplateDefinition[] = [
  {
    type: "speed_boost",
    label: "单体提速",
    description: "点击后立刻提升当前飞行速度，可附带持续加速。",
    defaults: {
      type: "speed_boost",
      velocityMultiplier: 1.35,
      durationMs: 900,
    },
  },
  {
    type: "split",
    label: "分裂",
    description: "点击后分裂成多只小鸟，沿扇形散射。",
    defaults: {
      type: "split",
      childCount: 3,
      spreadAngleDeg: 32,
      childSpeedRatio: 0.84,
    },
  },
  {
    type: "balloon_push",
    label: "气球膨胀",
    description: "像气球一样膨胀，挤开周围建筑并造成峰值伤害。",
    defaults: {
      type: "balloon_push",
      expandDurationMs: 320,
      maxRadiusScale: 2.6,
      pushForce: 0.042,
      structureDamage: 52,
      pigDamage: 12,
    },
  },
  {
    type: "vertical_bomb_drop",
    label: "垂直轰炸",
    description: "投放垂直下落炸弹，鸟体受到反向冲量。",
    defaults: {
      type: "vertical_bomb_drop",
      bombCount: 2,
      dropIntervalMs: 140,
      bombRadius: 10,
      blastRadius: 88,
      structureDamage: 42,
      pigDamage: 30,
      recoilImpulse: 0.026,
    },
  },
  {
    type: "forward_shockwave",
    label: "向前冲击波",
    description: "沿飞行方向释放矩形冲击波。",
    defaults: {
      type: "forward_shockwave",
      length: 220,
      width: 96,
      impulse: 0.018,
      structureDamage: 24,
      pigDamage: 16,
    },
  },
  {
    type: "radial_shockwave",
    label: "全方位冲击波",
    description: "以鸟为中心释放 360° 冲击波。",
    defaults: {
      type: "radial_shockwave",
      radius: 110,
      impulse: 0.016,
      structureDamage: 20,
      pigDamage: 18,
    },
  },
  {
    type: "point_blast",
    label: "单点爆炸",
    description: "单点高伤爆炸，边缘按 falloff 衰减。",
    defaults: {
      type: "point_blast",
      radius: 88,
      centerStructureDamage: 48,
      centerPigDamage: 36,
      falloff: 0.8,
    },
  },
  {
    type: "lightning_storm",
    label: "范围雷暴",
    description: "直接攻击范围内猪本体，绕过建筑。",
    defaults: {
      type: "lightning_storm",
      radius: 150,
      pigDamage: 42,
    },
  },
  {
    type: "burn_aura",
    label: "范围灼烧",
    description: "对建筑施加持续灼烧，木头更易受损。",
    defaults: {
      type: "burn_aura",
      radius: 130,
      durationMs: 2400,
      tickIntervalMs: 450,
      damagePerTick: 8,
      woodMultiplier: 2.2,
    },
  },
  {
    type: "poison_aura",
    label: "范围中毒",
    description: "对猪施加持续中毒，绕过建筑防护。",
    defaults: {
      type: "poison_aura",
      radius: 120,
      durationMs: 2800,
      tickIntervalMs: 500,
      damagePerTick: 10,
    },
  },
];
