import { getPlayerPreparation } from "../api/player-preparation-api.js";
import type { BirdInventory } from "../objects/level/bird-inventory.js";
import {
  buildBirdQueue,
  birdDefinitionFromUpgradeState,
  DEFAULT_BIRD_DEFINITION,
  type BirdDefinition,
} from "./game-engine/bird-definition.js";
import { readSelectedBirdType } from "./player-bird-selection.js";

export const resolveBirdQueueForLevel = async (
  userId: string | undefined,
  inventory: BirdInventory | undefined,
): Promise<BirdDefinition[]> => {
  const resolvedInventory = inventory ?? { basic: 1 };

  if (!userId) {
    return buildBirdQueue(resolvedInventory, DEFAULT_BIRD_DEFINITION);
  }

  try {
    const preparation = await getPlayerPreparation(userId);
    const catalog = preparation.birds.map(birdDefinitionFromUpgradeState);
    const selectedType = readSelectedBirdType(userId);
    const selectedBird =
      catalog.find((bird) => bird.birdType === selectedType)
      ?? catalog[0]
      ?? DEFAULT_BIRD_DEFINITION;

    return buildBirdQueue(resolvedInventory, selectedBird, catalog);
  } catch {
    return buildBirdQueue(resolvedInventory, DEFAULT_BIRD_DEFINITION);
  }
};
