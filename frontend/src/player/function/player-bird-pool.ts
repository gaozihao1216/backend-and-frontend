import { getPlayerPreparation } from "../../api/player/preparation/GetPreparationStateApi.js";
import type { LevelData } from "../../objects/level/level/level-data.js";
import type { BirdPool } from "../../objects/level/inventory/bird-pool.js";
import { normalizeBirdPool } from "../../level/function/bird-pool.js";
import {
  birdDefinitionFromUpgradeState,
  DEFAULT_BIRD_DEFINITION,
  listSystemBirdDefinitions,
  type BirdDefinition,
} from "../../game/engine/bird/bird-definition.js";
import type { BirdPoolLaunchConfig } from "../../game/engine/bird/bird-pool-session.js";

const defaultCatalog = (): BirdDefinition[] => listSystemBirdDefinitions();

export const resolveBirdPoolForLevel = async (
  userId: string | undefined,
  levelData: LevelData | undefined,
  assignmentBirdPool?: BirdPool,
): Promise<BirdPoolLaunchConfig> => {
  const pool = assignmentBirdPool ?? normalizeBirdPool({
    birdInventory: levelData?.birdInventory ?? { basic: 1 },
    birdPool: levelData?.birdPool,
  });

  if (!userId) {
    return {
      totalBirds: pool.totalBirds,
      allowedBirdTypes: pool.allowedBirdTypes,
      caps: pool.caps,
      catalog: defaultCatalog(),
    };
  }

  try {
    const preparation = await getPlayerPreparation(userId);
    const catalog = preparation.birds.map(birdDefinitionFromUpgradeState);
    return {
      totalBirds: pool.totalBirds,
      allowedBirdTypes: pool.allowedBirdTypes,
      caps: pool.caps,
      catalog: catalog.length > 0 ? catalog : defaultCatalog(),
    };
  } catch {
    return {
      totalBirds: pool.totalBirds,
      allowedBirdTypes: pool.allowedBirdTypes,
      caps: pool.caps,
      catalog: defaultCatalog(),
    };
  }
};

export const resolveDesignerPreviewBirdPool = (levelData: LevelData): BirdPoolLaunchConfig => {
  const pool = normalizeBirdPool(levelData);
  return {
    totalBirds: pool.totalBirds,
    allowedBirdTypes: pool.allowedBirdTypes,
    caps: pool.caps,
    catalog: defaultCatalog(),
  };
};

export const EMPTY_BIRD_DEFINITION = DEFAULT_BIRD_DEFINITION;
