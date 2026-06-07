import type { Level } from "../../lib/level-contracts.js";
import { createPublishedLevelSource, type LevelSource } from "../../lib/level-repository.js";
import { PlayableLevelSurface } from "./PlayableLevelSurface.js";

type LevelPreviewCardProps = {
  level?: Level;
  source?: LevelSource;
  userId?: string;
  defaultOpen?: boolean;
  onExit?: () => void;
};

export const LevelPreviewCard = ({
  level,
  source,
  userId,
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
      defaultOpen={defaultOpen}
      {...(onExit ? { onExit } : {})}
    />
  );
};
