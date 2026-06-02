import { useEffect, useState } from "react";
import { getMinimumAreaSelectionFrame } from "../../../lib/designer-level.js";
import type { EditorClipboardSelection, EditorTool } from "../../../lib/designer-level.js";
import type { LevelData, LevelObstacle } from "../../../lib/level-contracts.js";

export type UseDesignerEditorParams = {
  levelData: LevelData;
};

export const useDesignerEditor = ({ levelData }: UseDesignerEditorParams) => {
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [primarySelectedEntityId, setPrimarySelectedEntityId] = useState<string | null>(null);
  const [clipboardSelection, setClipboardSelection] = useState<EditorClipboardSelection | null>(null);
  const [canvasPointer, setCanvasPointer] = useState<{ x: number; y: number } | null>(null);
  const [gridSize, setGridSize] = useState(16);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [groupRotationAngle, setGroupRotationAngle] = useState(0);
  const [groupSelectionCenter, setGroupSelectionCenter] = useState<{ x: number; y: number } | null>(null);
  const [groupSelectionSize, setGroupSelectionSize] = useState<{ width: number; height: number } | null>(null);

  const selectedObstacle: LevelObstacle | null =
    levelData.obstacles.find((obstacle) => obstacle.id === primarySelectedEntityId) ?? null;

  const resetEditorSelection = () => {
    setSelectedEntityIds([]);
    setPrimarySelectedEntityId(null);
    setActiveTool("select");
    setGroupRotationAngle(0);
    setGroupSelectionCenter(null);
    setGroupSelectionSize(null);
  };

  // 当多选时，同步 group selection frame
  useEffect(() => {
    if (selectedEntityIds.length > 1) {
      const frame = getMinimumAreaSelectionFrame(levelData, selectedEntityIds);
      setGroupRotationAngle(frame?.rotation ?? 0);
      setGroupSelectionCenter(frame ? { x: frame.centerX, y: frame.centerY } : null);
      setGroupSelectionSize(frame ? { width: frame.width, height: frame.height } : null);
      return;
    }

    setGroupRotationAngle(0);
    setGroupSelectionCenter(null);
    setGroupSelectionSize(null);
  }, [selectedEntityIds, primarySelectedEntityId]);

  // 当 levelData 变化时，清理已不存在的选中实体
  useEffect(() => {
    if (selectedEntityIds.length === 0) {
      return;
    }

    const nextSelectedIds = selectedEntityIds.filter((entityId) =>
      levelData.obstacles.some((obstacle) => obstacle.id === entityId)
      || levelData.enemies.some((enemy) => enemy.id === entityId),
    );
    if (nextSelectedIds.length !== selectedEntityIds.length) {
      setSelectedEntityIds(nextSelectedIds);
      setPrimarySelectedEntityId(
        primarySelectedEntityId && nextSelectedIds.includes(primarySelectedEntityId)
          ? primarySelectedEntityId
          : nextSelectedIds.at(-1) ?? null,
      );
    }
  }, [levelData, primarySelectedEntityId, selectedEntityIds]);

  return {
    activeTool,
    setActiveTool,
    selectedEntityIds,
    setSelectedEntityIds,
    primarySelectedEntityId,
    setPrimarySelectedEntityId,
    clipboardSelection,
    setClipboardSelection,
    canvasPointer,
    setCanvasPointer,
    gridSize,
    setGridSize,
    isAltPressed,
    setIsAltPressed,
    groupRotationAngle,
    setGroupRotationAngle,
    groupSelectionCenter,
    setGroupSelectionCenter,
    groupSelectionSize,
    setGroupSelectionSize,
    selectedObstacle,
    resetEditorSelection,
  };
};
