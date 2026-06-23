import {
  DEFAULT_BIRD_DEFINITION,
  listSystemBirdDefinitions,
  resolveBirdFillColor,
  type BirdDefinition,
} from "./game-engine/bird-definition.js";
import type { BirdPoolLaunchConfig } from "./game-engine/bird-pool-session.js";
import type { BirdSkillSet } from "./game-engine/skills/skill-spec.js";
import type { DirectorBirdSkillEntry } from "../objects/bird/skill/director/director-bird-skill-entry.js";

export const buildDirectorTestBirdDefinition = (
  entry: DirectorBirdSkillEntry,
  skillSet: BirdSkillSet,
  testTier: number,
  modelImageUrl?: string,
): BirdDefinition => {
  const systemBird = listSystemBirdDefinitions().find((bird) => bird.birdType === entry.birdType);
  const baseProfile = systemBird?.combatProfile ?? DEFAULT_BIRD_DEFINITION.combatProfile;
  const definition: BirdDefinition = {
    birdType: entry.birdType,
    name: entry.name,
    combatProfile: {
      ...baseProfile,
      tier: Math.min(Math.max(testTier, 1), 3),
    },
    fillColor: resolveBirdFillColor(entry.birdType, entry.source),
    source: entry.source,
    skills: skillSet,
  };

  if (modelImageUrl?.trim()) {
    definition.modelImageUrl = modelImageUrl.trim();
  }

  return definition;
};

export const buildSkillTestLaunchConfig = (
  entry: DirectorBirdSkillEntry,
  skillSet: BirdSkillSet,
  testTier: number,
  modelImageUrl?: string,
): BirdPoolLaunchConfig => {
  const definition = buildDirectorTestBirdDefinition(entry, skillSet, testTier, modelImageUrl);
  return {
    totalBirds: 5,
    allowedBirdTypes: [entry.birdType],
    caps: { [entry.birdType]: 5 },
    catalog: [definition],
  };
};
