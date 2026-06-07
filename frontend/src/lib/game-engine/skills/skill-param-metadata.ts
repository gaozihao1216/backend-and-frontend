import type { SkillSpec } from "./skill-spec.js";

export type SkillParamField = {
  key: string;
  label: string;
  hint: string;
  unit?: string;
};

const COMMON_FIELDS: Record<string, SkillParamField> = {
  velocityMultiplier: { key: "velocityMultiplier", label: "速度倍率", hint: "相对当前速度的放大倍数", unit: "×" },
  durationMs: { key: "durationMs", label: "持续时长", hint: "加速效果维持的毫秒数", unit: "ms" },
  childCount: { key: "childCount", label: "分裂数量", hint: "点击后生成的子鸟数量", unit: "只" },
  spreadAngleDeg: { key: "spreadAngleDeg", label: "散射总角度", hint: "以点击瞬间飞行方向为中线，左右对称展开的角度", unit: "°" },
  childSpeedRatio: { key: "childSpeedRatio", label: "子鸟速度比", hint: "子鸟速度 = 母鸟速度 × 该比例", unit: "×" },
  expandDurationMs: { key: "expandDurationMs", label: "膨胀时长", hint: "从点击到达到最大体积的毫秒数", unit: "ms" },
  maxRadiusScale: { key: "maxRadiusScale", label: "最大半径倍率", hint: "相对鸟体原始碰撞半径的放大倍数", unit: "×" },
  pushForce: { key: "pushForce", label: "挤开力度", hint: "膨胀过程中推开建筑的力", unit: "N" },
  structureDamage: { key: "structureDamage", label: "建筑伤害", hint: "对障碍/方块造成的基础伤害", unit: "点" },
  pigDamage: { key: "pigDamage", label: "猪伤害", hint: "对猪造成的基础伤害", unit: "点" },
  bombCount: { key: "bombCount", label: "炸弹数量", hint: "一次点击投下的炸弹数", unit: "枚" },
  dropIntervalMs: { key: "dropIntervalMs", label: "投放间隔", hint: "多枚炸弹之间的间隔", unit: "ms" },
  bombRadius: { key: "bombRadius", label: "炸弹半径", hint: "下落弹体的碰撞半径", unit: "px" },
  blastRadius: { key: "blastRadius", label: "爆炸半径", hint: "落地后伤害与冲击的作用范围", unit: "px" },
  recoilImpulse: { key: "recoilImpulse", label: "反向冲量", hint: "投弹后施加在鸟体上的向上反作用力", unit: "N" },
  length: { key: "length", label: "冲击长度", hint: "沿点击瞬间飞行方向向前延伸的距离", unit: "px" },
  width: { key: "width", label: "冲击宽度", hint: "垂直于飞行方向的矩形宽度", unit: "px" },
  impulse: { key: "impulse", label: "冲击冲量", hint: "推动目标物体的力度", unit: "N" },
  radius: { key: "radius", label: "作用半径", hint: "以鸟当前位置为圆心的范围", unit: "px" },
  centerStructureDamage: { key: "centerStructureDamage", label: "中心建筑伤害", hint: "爆炸中心对建筑的伤害", unit: "点" },
  centerPigDamage: { key: "centerPigDamage", label: "中心猪伤害", hint: "爆炸中心对猪的伤害", unit: "点" },
  falloff: { key: "falloff", label: "边缘衰减", hint: "0=边缘仍有满伤，1=边缘伤害为 0", unit: "" },
  tickIntervalMs: { key: "tickIntervalMs", label: "跳伤间隔", hint: "持续效果每隔多少毫秒结算一次", unit: "ms" },
  damagePerTick: { key: "damagePerTick", label: "每次伤害", hint: "每个跳伤间隔造成的伤害", unit: "点" },
  woodMultiplier: { key: "woodMultiplier", label: "木头倍率", hint: "灼烧对木头建筑的额外倍率", unit: "×" },
};

export const SKILL_PARAM_FIELDS: Record<SkillSpec["type"], SkillParamField[]> = {
  speed_boost: [COMMON_FIELDS.velocityMultiplier!, COMMON_FIELDS.durationMs!],
  split: [COMMON_FIELDS.childCount!, COMMON_FIELDS.spreadAngleDeg!, COMMON_FIELDS.childSpeedRatio!],
  balloon_push: [
    COMMON_FIELDS.expandDurationMs!,
    COMMON_FIELDS.maxRadiusScale!,
    COMMON_FIELDS.pushForce!,
    COMMON_FIELDS.structureDamage!,
    COMMON_FIELDS.pigDamage!,
  ],
  vertical_bomb_drop: [
    COMMON_FIELDS.bombCount!,
    COMMON_FIELDS.dropIntervalMs!,
    COMMON_FIELDS.bombRadius!,
    COMMON_FIELDS.blastRadius!,
    COMMON_FIELDS.structureDamage!,
    COMMON_FIELDS.pigDamage!,
    COMMON_FIELDS.recoilImpulse!,
  ],
  forward_shockwave: [
    COMMON_FIELDS.length!,
    COMMON_FIELDS.width!,
    COMMON_FIELDS.impulse!,
    COMMON_FIELDS.structureDamage!,
    COMMON_FIELDS.pigDamage!,
  ],
  radial_shockwave: [
    COMMON_FIELDS.radius!,
    COMMON_FIELDS.impulse!,
    COMMON_FIELDS.structureDamage!,
    COMMON_FIELDS.pigDamage!,
  ],
  point_blast: [
    COMMON_FIELDS.radius!,
    COMMON_FIELDS.centerStructureDamage!,
    COMMON_FIELDS.centerPigDamage!,
    COMMON_FIELDS.falloff!,
  ],
  lightning_storm: [COMMON_FIELDS.radius!, COMMON_FIELDS.pigDamage!],
  burn_aura: [
    COMMON_FIELDS.radius!,
    { key: "durationMs", label: "持续时长", hint: "灼烧状态维持的毫秒数", unit: "ms" },
    COMMON_FIELDS.tickIntervalMs!,
    COMMON_FIELDS.damagePerTick!,
    COMMON_FIELDS.woodMultiplier!,
  ],
  poison_aura: [
    COMMON_FIELDS.radius!,
    { key: "durationMs", label: "持续时长", hint: "中毒状态维持的毫秒数", unit: "ms" },
    COMMON_FIELDS.tickIntervalMs!,
    COMMON_FIELDS.damagePerTick!,
  ],
};

const formatValue = (value: unknown, unit?: string) => {
  if (value === undefined || value === null || value === "") {
    return "—";
  }
  return unit ? `${value}${unit}` : String(value);
};

export const formatSpecSummary = (spec: SkillSpec): string[] => {
  const fields = SKILL_PARAM_FIELDS[spec.type];
  return fields.map((field) => {
    const raw = (spec as Record<string, unknown>)[field.key];
    if (raw === undefined) {
      return null;
    }
    return `${field.label} ${formatValue(raw, field.unit)}`;
  }).filter((line): line is string => line !== null);
};
