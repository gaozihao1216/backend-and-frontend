import { useState } from "react";
import type { LevelSource } from "../../lib/level-repository.js";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../lib/game-engine/constants.js";
import { useLevelBackgroundTemplateResolution } from "../../hook/useLevelBackgroundTemplateResolution.js";
import { LevelBackgroundStageLayer } from "../designer-page/LevelBackgroundStageLayer.js";
import { GameCanvas } from "./GameCanvas.js";

type PlayableLevelSurfaceProps = {
  source: LevelSource;
  defaultOpen?: boolean;
  onExit?: () => void;
};

export const PlayableLevelSurface = ({
  source,
  defaultOpen = false,
  onExit,
}: PlayableLevelSurfaceProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const [instanceKey, setInstanceKey] = useState(0);
  const {
    template: levelBackgroundTemplate,
    panelBackgroundDesign,
    cloudPatternDesigns,
  } = useLevelBackgroundTemplateResolution(
    source.level.data.backgroundTemplateId,
    source.level.authorId,
  );

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
