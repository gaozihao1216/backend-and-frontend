import { useEffect, useRef, useState } from "react";
import { drawScene } from "../../game-engine/draw-scene.js";
import { createGameSession } from "../../game-engine/game-session/index.js";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../game-engine/constants.js";
import type { LevelData } from "../../lib/level-contracts.js";

type GameCanvasProps = {
  levelKey: string;
  levelData?: LevelData;
  restartToken?: number;
};

export const GameCanvas = ({
  levelKey,
  levelData,
  restartToken = 0,
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

  useEffect(() => {
    // 动画帧里读取的是 ref，避免每次缩放都重建整条渲染循环。
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

    // 每次切关卡或重开时，重新创建一个全新的游戏 session。
    const session = createGameSession(levelData);
    sessionRef.current = session;
    let animationFrameId = 0;
    let lastTimestamp = performance.now();

    const renderFrame = (timestamp: number) => {
      const deltaMs = Math.min(timestamp - lastTimestamp, 32);
      lastTimestamp = timestamp;

      // session 负责推进物理世界，drawScene 负责把快照画出来。
      session.step(deltaMs);
      const snapshot = session.getSnapshot();
      drawScene(context, snapshot, viewRef.current.zoom, viewRef.current.center);
      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    animationFrameId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      sessionRef.current = null;
      session.destroy();
    };
  }, [levelKey, restartToken]);

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
      // 视图变成“缩放 + 中心点”后，屏幕坐标需要围绕当前视口中心反算。
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

    if (session.beginDrag(point.x, point.y)) {
      draggingRef.current = true;
      // 成功拖拽后锁定 pointer，保证拖出 canvas 也能持续收到事件。
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

  return (
    <div style={{ width: "100%", overflowX: "auto", position: "relative" }}>
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
          background: "#d9efff",
          touchAction: "none",
        }}
      />
    </div>
  );
};
