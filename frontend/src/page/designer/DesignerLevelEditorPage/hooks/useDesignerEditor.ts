import { useEffect, useState } from "react";
import { getMinimumAreaSelectionFrame } from "../../../../level/function/designer-level.js";
import type { EditorClipboardSelection, EditorTool } from "../../../../level/function/designer-level.js";
import type { LevelData, LevelObstacle } from "../../../../objects/level/level/level-data.js";

export type UseDesignerEditorParams = {
  levelData: LevelData;
};

/**
 * 管理非地形实体编辑状态。
 *
 * 包括当前工具、实体单选/多选、复制粘贴剪贴板、网格、Alt 修饰键和多选旋转框。
 * 关卡数据本身不在这里修改，只根据 levelData 派生当前选择信息。
 */
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

  // 外部整体替换 levelData 或切换编辑模式时调用，保证选择状态回到普通选择工具。
  const resetEditorSelection = () => {
    setSelectedEntityIds([]);
    setPrimarySelectedEntityId(null);
    setActiveTool("select");
    setGroupRotationAngle(0);
    setGroupSelectionCenter(null);
    setGroupSelectionSize(null);
  };

  // 当多选时，同步 group selection frame，旋转工具依赖这个包围框的中心和尺寸。
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

  // 当 levelData 变化时，清理已不存在的选中实体，避免删除/撤销后引用悬空 ID。
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
