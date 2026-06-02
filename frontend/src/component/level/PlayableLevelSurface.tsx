import { useState } from "react";
import type { LevelSource } from "../../lib/level-repository.js";
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

  const handleExit = () => {
    setOpen(false);
    onExit?.();
  };

  return (
    <section className="comment-section">
      {open ? (
        <div style={{ position: "relative" }}>
          <GameCanvas
            levelKey={source.key}
            levelData={source.level.data}
            restartToken={instanceKey}
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
