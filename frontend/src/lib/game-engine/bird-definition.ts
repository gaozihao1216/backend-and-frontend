import type { BirdUpgradeState } from "../../api/player-preparation-api.js";
import type { BirdInventory } from "../../objects/level/bird-inventory.js";
import {
  DEFAULT_COMBAT_PROFILE,
  type CombatProfile,
} from "./combat-profile.js";

export type BirdDefinition = {
  birdType: string;
  name: string;
  combatProfile: CombatProfile;
  fillColor: string;
  source: "system" | "designer";
};

const SYSTEM_BIRD_DEFINITIONS: Record<string, BirdDefinition> = {
  basic: {
    birdType: "basic",
    name: "基础鸟",
    combatProfile: DEFAULT_COMBAT_PROFILE,
    fillColor: "#d84a3f",
    source: "system",
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

export const birdDefinitionFromUpgradeState = (bird: BirdUpgradeState): BirdDefinition => ({
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
});

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
