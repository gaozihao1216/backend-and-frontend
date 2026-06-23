import type { Level } from "../../objects/level/level/level.js";
import type { BirdPool } from "../../objects/level/inventory/bird-pool.js";
import { createPublishedLevelSource, type LevelSource } from "../../lib/level-repository.js";
import { PlayableLevelSurface } from "./PlayableLevelSurface.js";

type LevelPreviewCardProps = {
  level?: Level;
  source?: LevelSource;
  userId?: string;
  birdPool?: BirdPool;
  defaultOpen?: boolean;
  onExit?: () => void;
};

export const LevelPreviewCard = ({
  level,
  source,
  userId,
  birdPool,
  defaultOpen = false,
  onExit,
}: LevelPreviewCardProps) => {
  const resolvedSource = source ?? (level ? createPublishedLevelSource(level) : null);

  if (!resolvedSource) {
    return null;
  }

  return (
    <PlayableLevelSurface
      source={resolvedSource}
      {...(userId ? { userId } : {})}
      {...(birdPool ? { birdPool } : {})}
      defaultOpen={defaultOpen}
      {...(onExit ? { onExit } : {})}
    />
  );
};
