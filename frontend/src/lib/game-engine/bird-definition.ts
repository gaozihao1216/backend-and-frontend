import type { BirdUpgradeState } from "../../api/player-preparation-api.js";
import type { BirdInventory } from "../../objects/level/bird-inventory.js";
import {
  DEFAULT_COMBAT_PROFILE,
  type CombatProfile,
} from "./combat-profile.js";
import { BirdSkillSetSchema, type BirdSkillSet } from "./skills/skill-spec.js";

export type BirdDefinition = {
  birdType: string;
  name: string;
  combatProfile: CombatProfile;
  fillColor: string;
  source: "system" | "designer";
  skills: BirdSkillSet;
  modelImageUrl?: string;
};

const BASIC_SKILLS: BirdSkillSet = {
  stages: [
    {
      id: "basic-tier-1",
      label: "一阶·精准冲击",
      trigger: "on_tap",
      specs: [
        {
          type: "forward_shockwave",
          length: 150,
          width: 48,
          impulse: 0.013,
          structureDamage: 40,
          pigDamage: 32,
        },
      ],
      maxActivations: 1,
    },
    {
      id: "basic-tier-2",
      label: "二阶·扩散冲击",
      trigger: "on_tap",
      specs: [
        {
          type: "forward_shockwave",
          length: 170,
          width: 64,
          impulse: 0.015,
          structureDamage: 34,
          pigDamage: 26,
        },
        {
          type: "radial_shockwave",
          radius: 88,
          impulse: 0.014,
          structureDamage: 22,
          pigDamage: 16,
        },
      ],
      maxActivations: 1,
    },
    {
      id: "basic-tier-3",
      label: "三阶·二次冲击",
      trigger: "on_tap",
      specs: [
        {
          type: "forward_shockwave",
          length: 185,
          width: 72,
          impulse: 0.016,
          structureDamage: 30,
          pigDamage: 24,
        },
        {
          type: "point_blast",
          radius: 68,
          centerStructureDamage: 45,
          centerPigDamage: 35,
          falloff: 0.72,
        },
        {
          type: "radial_shockwave",
          radius: 102,
          impulse: 0.018,
          structureDamage: 24,
          pigDamage: 18,
        },
      ],
      maxActivations: 1,
    },
  ],
};

const SPLIT_SKILLS: BirdSkillSet = {
  stages: [
    {
      id: "split-tier-1",
      label: "一阶·三连分裂",
      trigger: "on_tap",
      specs: [
        {
          type: "split",
          childCount: 3,
          spreadAngleDeg: 32,
          childSpeedRatio: 0.84,
        },
      ],
      maxActivations: 1,
    },
    {
      id: "split-tier-2",
      label: "二阶·加速分裂",
      trigger: "on_tap",
      specs: [
        {
          type: "speed_boost",
          velocityMultiplier: 1.35,
          durationMs: 900,
        },
        {
          type: "split",
          childCount: 3,
          spreadAngleDeg: 36,
          childSpeedRatio: 0.9,
        },
      ],
      maxActivations: 1,
    },
    {
      id: "split-tier-3",
      label: "三阶·冲击分裂",
      trigger: "on_tap",
      specs: [
        {
          type: "split",
          childCount: 4,
          spreadAngleDeg: 40,
          childSpeedRatio: 0.92,
        },
        {
          type: "radial_shockwave",
          radius: 110,
          impulse: 0.016,
          structureDamage: 20,
          pigDamage: 18,
        },
      ],
      maxActivations: 1,
    },
  ],
};

const BOMB_SKILLS: BirdSkillSet = {
  stages: [
    {
      id: "bomb-tier-1",
      label: "一阶·垂直轰炸",
      trigger: "on_tap",
      specs: [
        {
          type: "vertical_bomb_drop",
          bombCount: 2,
          dropIntervalMs: 140,
          bombRadius: 10,
          blastRadius: 88,
          structureDamage: 42,
          pigDamage: 30,
          recoilImpulse: 0.026,
        },
      ],
      maxActivations: 1,
    },
    {
      id: "bomb-tier-2",
      label: "二阶·密集轰炸",
      trigger: "on_tap",
      specs: [
        {
          type: "vertical_bomb_drop",
          bombCount: 3,
          dropIntervalMs: 110,
          bombRadius: 11,
          blastRadius: 96,
          structureDamage: 46,
          pigDamage: 34,
          recoilImpulse: 0.03,
        },
        {
          type: "point_blast",
          radius: 72,
          centerStructureDamage: 28,
          centerPigDamage: 22,
          falloff: 0.75,
        },
      ],
      maxActivations: 1,
    },
    {
      id: "bomb-tier-3",
      label: "三阶·雷暴轰炸",
      trigger: "on_tap",
      specs: [
        {
          type: "vertical_bomb_drop",
          bombCount: 3,
          dropIntervalMs: 90,
          bombRadius: 12,
          blastRadius: 104,
          structureDamage: 50,
          pigDamage: 36,
          recoilImpulse: 0.034,
        },
        {
          type: "lightning_storm",
          radius: 150,
          pigDamage: 42,
        },
        {
          type: "poison_aura",
          radius: 120,
          durationMs: 2800,
          tickIntervalMs: 500,
          damagePerTick: 10,
        },
      ],
      maxActivations: 1,
    },
  ],
};

const SYSTEM_BIRD_DEFINITIONS: Record<string, BirdDefinition> = {
  basic: {
    birdType: "basic",
    name: "基础鸟",
    combatProfile: DEFAULT_COMBAT_PROFILE,
    fillColor: "#d84a3f",
    source: "system",
    skills: BASIC_SKILLS,
  },
  split: {
    birdType: "split",
    name: "分裂鸟",
    combatProfile: {
      attack: 70,
      impact: 60,
      speed: 85,
      tier: 1,
    },
    fillColor: "#38bdf8",
    source: "system",
    skills: SPLIT_SKILLS,
  },
  bomb: {
    birdType: "bomb",
    name: "爆炸鸟",
    combatProfile: {
      attack: 120,
      impact: 110,
      speed: 45,
      tier: 1,
    },
    fillColor: "#374151",
    source: "system",
    skills: BOMB_SKILLS,
  },
};

export const DEFAULT_BIRD_DEFINITION = SYSTEM_BIRD_DEFINITIONS.basic!;

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

export const resolveBirdFillColor = (birdType: string, source: BirdDefinition["source"]) => {
  const preset = SYSTEM_BIRD_DEFINITIONS[birdType];
  if (preset) {
    return preset.fillColor;
  }

  if (source === "designer") {
    const hue = hashString(birdType) % 360;
    return `hsl(${hue} 68% 52%)`;
  }

  return DEFAULT_BIRD_DEFINITION.fillColor;
};

const defaultDesignerSkills = (bird: BirdUpgradeState): BirdSkillSet => ({
  stages: [
    {
      id: `${bird.birdType}-tier-1`,
      label: bird.skillName || "一阶技能",
      trigger: "on_tap",
      specs: [
        {
          type: "point_blast",
          radius: 80 + bird.stats.attack * 0.15,
          centerStructureDamage: bird.stats.impact * 0.45,
          centerPigDamage: bird.stats.attack * 0.35,
          falloff: 0.8,
        },
      ],
      maxActivations: 1,
    },
    {
      id: `${bird.birdType}-tier-2`,
      label: "二阶技能",
      trigger: "on_tap",
      specs: [
        {
          type: "radial_shockwave",
          radius: 95 + bird.stats.impact * 0.1,
          impulse: 0.014 + bird.stats.speed * 0.00008,
          structureDamage: bird.stats.impact * 0.35,
          pigDamage: bird.stats.attack * 0.3,
        },
      ],
      maxActivations: 1,
    },
    {
      id: `${bird.birdType}-tier-3`,
      label: "三阶技能",
      trigger: "on_tap",
      specs: [
        {
          type: "lightning_storm",
          radius: 130,
          pigDamage: bird.stats.attack * 0.5,
        },
        {
          type: "burn_aura",
          radius: 110,
          durationMs: 2200,
          tickIntervalMs: 420,
          damagePerTick: Math.max(6, bird.stats.impact * 0.08),
          woodMultiplier: 2,
        },
      ],
      maxActivations: 1,
    },
  ],
});

export const birdDefinitionFromUpgradeState = (bird: BirdUpgradeState): BirdDefinition => {
  const parsedSkills = bird.skills ? BirdSkillSetSchema.safeParse(bird.skills) : null;
  return {
    birdType: bird.birdType,
    name: bird.name,
    combatProfile: {
      attack: bird.stats.attack,
      impact: bird.stats.impact,
      speed: bird.stats.speed,
      tier: bird.tier,
    },
    fillColor: resolveBirdFillColor(bird.birdType, bird.source),
    source: bird.source,
    skills: parsedSkills?.success
      ? parsedSkills.data
      : (SYSTEM_BIRD_DEFINITIONS[bird.birdType]?.skills ?? defaultDesignerSkills(bird)),
    ...(bird.modelImageUrl ? { modelImageUrl: bird.modelImageUrl } : {}),
  };
};

export const resolveBirdDefinition = (
  birdType: string,
  selectedBird: BirdDefinition,
  catalog: BirdDefinition[] = [],
): BirdDefinition => {
  if (birdType === selectedBird.birdType) {
    return selectedBird;
  }

  const fromCatalog = catalog.find((entry) => entry.birdType === birdType);
  if (fromCatalog) {
    return fromCatalog;
  }

  const systemBird = SYSTEM_BIRD_DEFINITIONS[birdType];
  if (systemBird) {
    return systemBird;
  }

  return {
    ...selectedBird,
    birdType,
    name: selectedBird.name,
  };
};

export const buildBirdQueue = (
  inventory: BirdInventory,
  selectedBird: BirdDefinition,
  catalog: BirdDefinition[] = [],
): BirdDefinition[] => {
  const entries = Object.entries(inventory).filter(([, count]) => count > 0);
  if (entries.length === 0) {
    return [selectedBird];
  }

  if (entries.length === 1 && entries[0]![0] === "basic") {
    return Array.from({ length: entries[0]![1] }, () => selectedBird);
  }

  return entries.flatMap(([birdType, count]) =>
    Array.from({ length: count }, () => resolveBirdDefinition(birdType, selectedBird, catalog)),
  );
};

export const listSystemBirdDefinitions = () => Object.values(SYSTEM_BIRD_DEFINITIONS);

export { BASIC_SKILLS, SPLIT_SKILLS, BOMB_SKILLS };
