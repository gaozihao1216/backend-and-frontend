import type { Level } from "../../../shared/types.js";
import { createPublishedLevelSource, type LevelSource } from "../../lib/level-repository.js";
import { PlayableLevelSurface } from "./PlayableLevelSurface.js";

type LevelPreviewCardProps = {
  level?: Level;
  source?: LevelSource;
  defaultOpen?: boolean;
  onExit?: () => void;
};

export const LevelPreviewCard = ({
  level,
  source,
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
      defaultOpen={defaultOpen}
      {...(onExit ? { onExit } : {})}
    />
  );
};
