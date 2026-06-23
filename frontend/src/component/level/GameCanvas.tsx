import { useEffect, useRef, useState } from "react";
import { drawScene } from "../../lib/game-engine/draw-scene.js";
import { createGameSession } from "../../lib/game-engine/game-session/index.js";
import type { BirdPoolLaunchConfig } from "../../lib/game-engine/bird-pool-session.js";
import type { GameSnapshot } from "../../lib/game-engine/types.js";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../lib/game-engine/constants.js";
import type { LevelData } from "../../objects/level/level/level-data.js";

type GameCanvasProps = {
  levelKey: string;
  levelData?: LevelData;
  birdPoolConfig?: BirdPoolLaunchConfig;
  restartToken?: number;
  transparentBackground?: boolean;
};

const emptyHud: Pick<
  GameSnapshot,
  "awaitingBirdSelection" | "selectableBirds" | "shotsRemaining" | "status"
> = {
  awaitingBirdSelection: false,
  selectableBirds: [],
  shotsRemaining: 0,
  status: "ready",
};

export const GameCanvas = ({
  levelKey,
  levelData,
  birdPoolConfig,
  restartToken = 0,
  transparentBackground = false,
}: GameCanvasProps) => {
  const defaultView = {
    zoom: 1,
    center: {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
    },
  };
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<ReturnType<typeof createGameSession> | null>(null);
  const draggingRef = useRef(false);
  const [view, setView] = useState(defaultView);
  const viewRef = useRef(view);
  const [hud, setHud] = useState(emptyHud);
  const hudKeyRef = useRef("");

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    setView(defaultView);
  }, [levelKey, restartToken]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    const session = createGameSession({
      ...(levelData ? { levelData } : {}),
      ...(birdPoolConfig ? { birdPoolConfig } : {}),
    });
    sessionRef.current = session;
    let animationFrameId = 0;
    let lastTimestamp = performance.now();

    const renderFrame = (timestamp: number) => {
      const deltaMs = Math.min(timestamp - lastTimestamp, 32);
      lastTimestamp = timestamp;

      session.step(deltaMs);
      const snapshot = session.getSnapshot();
      drawScene(context, snapshot, viewRef.current.zoom, viewRef.current.center, {
        skipSky: transparentBackground,
      });

      const nextHudKey = [
        snapshot.awaitingBirdSelection,
        snapshot.shotsRemaining,
        snapshot.status,
        snapshot.selectableBirds.map((bird) => `${bird.birdType}:${bird.remaining}`).join("|"),
      ].join(":");
      if (nextHudKey !== hudKeyRef.current) {
        hudKeyRef.current = nextHudKey;
        setHud({
          awaitingBirdSelection: snapshot.awaitingBirdSelection,
          selectableBirds: snapshot.selectableBirds,
          shotsRemaining: snapshot.shotsRemaining,
          status: snapshot.status,
        });
      }

      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    animationFrameId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      sessionRef.current = null;
      session.destroy();
      hudKeyRef.current = "";
      setHud(emptyHud);
    };
  }, [levelKey, restartToken, levelData, birdPoolConfig, transparentBackground]);

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = WORLD_WIDTH / rect.width;
    const scaleY = WORLD_HEIGHT / rect.height;

    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;

    return {
      x: (canvasX - WORLD_WIDTH / 2) / viewRef.current.zoom + viewRef.current.center.x,
      y: (canvasY - WORLD_HEIGHT / 2) / viewRef.current.zoom + viewRef.current.center.y,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event);
    const session = sessionRef.current;
    if (!point || !session) {
      return;
    }

    const snapshot = session.getSnapshot();
    if (snapshot.birdLaunched && snapshot.status === "running") {
      session.activateSkill();
      return;
    }

    if (session.beginDrag(point.x, point.y)) {
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event);
    const session = sessionRef.current;
    if (!draggingRef.current || !point || !session) {
      return;
    }

    session.updateDrag(point.x, point.y);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) {
      return;
    }

    draggingRef.current = false;
    sessionRef.current?.endDrag();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = WORLD_WIDTH / rect.width;
    const scaleY = WORLD_HEIGHT / rect.height;
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;
    const currentView = viewRef.current;
    const pointerWorld = {
      x: (canvasX - WORLD_WIDTH / 2) / currentView.zoom + currentView.center.x,
      y: (canvasY - WORLD_HEIGHT / 2) / currentView.zoom + currentView.center.y,
    };

    setView((current) => {
      const nextZoom = Math.min(1.8, Math.max(0.7, Number((current.zoom + (event.deltaY < 0 ? 0.1 : -0.1)).toFixed(2))));
      return {
        zoom: nextZoom,
        center: {
          x: pointerWorld.x - (canvasX - WORLD_WIDTH / 2) / nextZoom,
          y: pointerWorld.y - (canvasY - WORLD_HEIGHT / 2) / nextZoom,
        },
      };
    });
  };

  const handleSelectBird = (birdType: string) => {
    sessionRef.current?.selectBird(birdType);
  };

  return (
    <div style={{ width: "100%", overflowX: "auto", position: "relative" }}>
      {hud.awaitingBirdSelection && hud.status !== "won" && hud.status !== "lost" ? (
        <div className="game-bird-picker" aria-label="选择小鸟">
          <p className="game-bird-picker-copy">选择下一只小鸟（剩余 {hud.shotsRemaining} 次）</p>
          <div className="game-bird-picker-list">
            {hud.selectableBirds.map((bird) => (
              <button
                key={bird.birdType}
                type="button"
                className="game-bird-picker-item"
                onClick={() => handleSelectBird(bird.birdType)}
              >
                <span
                  className="game-bird-picker-swatch"
                  style={{ background: bird.fillColor }}
                  aria-hidden="true"
                />
                <span>{bird.name}</span>
                <span className="game-bird-picker-count">×{bird.remaining}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{
          display: "block",
          maxWidth: "100%",
          border: "1px solid #d8dde6",
          borderRadius: "16px",
          background: transparentBackground ? "transparent" : "#d9efff",
          touchAction: "none",
        }}
      />
    </div>
  );
};
