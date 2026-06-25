import { useEffect, useState } from "react";
import type { LevelSource } from "../../level/function/level-repository.js";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../game/engine/core/constants.js";
import type { BirdPoolLaunchConfig } from "../../game/engine/bird/bird-pool-session.js";
import type { BirdPool } from "../../objects/level/inventory/bird-pool.js";
import { resolveBirdPoolForLevel } from "../../player/function/player-bird-pool.js";
import { useLevelBackgroundTemplateResolution } from "../../page/shared/hooks/level-background/useLevelBackgroundTemplateResolution.js";
import { LevelBackgroundStageLayer } from "../../page/designer/DesignerLevelEditorPage/components/design/LevelBackgroundStageLayer.js";
import { GameCanvas } from "./GameCanvas.js";

type PlayableLevelSurfaceProps = {
  source: LevelSource;
  userId?: string;
  birdPool?: BirdPool;
  defaultOpen?: boolean;
  onExit?: () => void;
};

export const PlayableLevelSurface = ({
  source,
  userId,
  birdPool,
  defaultOpen = false,
  onExit,
}: PlayableLevelSurfaceProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const [instanceKey, setInstanceKey] = useState(0);
  const [birdPoolConfig, setBirdPoolConfig] = useState<BirdPoolLaunchConfig | null>(null);
  const {
    template: levelBackgroundTemplate,
    panelBackgroundDesign,
    cloudPatternDesigns,
  } = useLevelBackgroundTemplateResolution(
    source.level.data.backgroundTemplateId,
    source.level.authorId,
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let cancelled = false;
    void resolveBirdPoolForLevel(userId, source.level.data, birdPool).then((config) => {
      if (!cancelled) {
        setBirdPoolConfig(config);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, userId, source.level.data, birdPool, instanceKey]);

  const handleExit = () => {
    setOpen(false);
    onExit?.();
  };

  return (
    <section className="comment-section">
      {open ? (
        <div
          className={`playable-level-surface${levelBackgroundTemplate ? " has-level-background" : ""}`}
          style={{ position: "relative" }}
        >
          {levelBackgroundTemplate ? (
            <div className="playable-level-background-layer" aria-hidden="true">
              <LevelBackgroundStageLayer
                template={levelBackgroundTemplate}
                panelBackgroundDesign={panelBackgroundDesign}
                cloudPatternDesigns={cloudPatternDesigns}
                width={WORLD_WIDTH}
                height={WORLD_HEIGHT}
              />
            </div>
          ) : null}
          <GameCanvas
            levelKey={source.key}
            levelData={source.level.data}
            {...(birdPoolConfig ? { birdPoolConfig } : {})}
            restartToken={instanceKey}
            transparentBackground={Boolean(levelBackgroundTemplate)}
          />
          <div
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              display: "flex",
              gap: "0.75rem",
              zIndex: 2,
            }}
          >
            <button
              type="button"
              onClick={() => setInstanceKey((current) => current + 1)}
            >
              重新开始
            </button>
            <button
              type="button"
              className="secondary"
              onClick={handleExit}
            >
              退出关卡
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)}>
          开始游戏
        </button>
      )}
    </section>
  );
};
