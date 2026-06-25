import type { BirdDefinition } from "./bird-definition.js";

export type BirdPoolLaunchConfig = {
  totalBirds: number;
  allowedBirdTypes: string[];
  caps: Record<string, number>;
  catalog: BirdDefinition[];
};

export type SelectableBirdOption = {
  birdType: string;
  name: string;
  fillColor: string;
  remaining: number;
};

export const createBirdPoolTracker = (config: BirdPoolLaunchConfig) => {
  let shotsRemaining = config.totalBirds;
  const usageByType: Record<string, number> = {};

  const isTypeAllowed = (birdType: string) =>
    config.allowedBirdTypes.length === 0 || config.allowedBirdTypes.includes(birdType);

  const getRemainingForType = (birdType: string) => {
    if (!isTypeAllowed(birdType) || shotsRemaining <= 0) {
      return 0;
    }

    const used = usageByType[birdType] ?? 0;
    const cap = config.caps[birdType];
    if (cap !== undefined) {
      return Math.max(0, Math.min(shotsRemaining, cap - used));
    }

    return shotsRemaining;
  };

  const getSelectableBirds = (): SelectableBirdOption[] =>
    config.catalog
      .filter((bird) => isTypeAllowed(bird.birdType))
      .map((bird) => ({
        birdType: bird.birdType,
        name: bird.name,
        fillColor: bird.fillColor,
        remaining: getRemainingForType(bird.birdType),
      }))
      .filter((bird) => bird.remaining > 0);

  const canSelect = (birdType: string) => getRemainingForType(birdType) > 0;

  const consumeShot = (birdType: string) => {
    usageByType[birdType] = (usageByType[birdType] ?? 0) + 1;
    shotsRemaining -= 1;
  };

  return {
    canSelect,
    consumeShot,
    getSelectableBirds,
    getShotsRemaining: () => shotsRemaining,
  };
};
