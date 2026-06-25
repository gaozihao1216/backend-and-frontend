import type { BirdInventory } from "../../objects/level/inventory/bird-inventory.js";
import { DEFAULT_BIRD_POOL, type BirdPool } from "../../objects/level/inventory/bird-pool.js";

type BirdPoolSource = {
  birdInventory: BirdInventory;
  birdPool?: BirdPool | undefined;
};

export const normalizeBirdPool = (source: BirdPoolSource): BirdPool => {
  if (source.birdPool) {
    return source.birdPool;
  }

  const entries = Object.entries(source.birdInventory).filter(([, count]) => count > 0);
  if (entries.length === 0) {
    return DEFAULT_BIRD_POOL;
  }

  if (entries.length === 1 && entries[0]![0] === "basic") {
    return {
      totalBirds: entries[0]![1],
      allowedBirdTypes: [],
      caps: {},
    };
  }

  return {
    totalBirds: entries.reduce((sum, [, count]) => sum + count, 0),
    allowedBirdTypes: entries.map(([birdType]) => birdType),
    caps: Object.fromEntries(entries),
  };
};

export const syncLegacyBirdInventory = (pool: BirdPool): BirdInventory => ({
  basic: pool.totalBirds,
});
