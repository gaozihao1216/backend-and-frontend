import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import {
  clearTerrainCeilingBoundary,
  createBottomBoundaryFromTop,
  ensureTerrainCeilingBoundary,
  getLevelTerrain,
  removeTerrainBoundaryPoint,
  removeTerrainVoidSpan,
  reorderTerrainBoundaryPoint,
  setTerrainBoundaryType,
} from "../../../lib/ground.js";
import type { TerrainBoundaryKind, TerrainEditMode } from "../../../lib/ground.js";
import type { LevelData } from "../../../../shared/types.js";

type ApplyLevelDataUpdate = (updater: LevelData | ((current: LevelData) => LevelData)) => void;

type UseDesignerGroundActionsParams = {
  activeBoundaryKind: TerrainBoundaryKind;
  applyLevelDataUpdate: ApplyLevelDataUpdate;
  bottomThickness: number;
  levelData: LevelData;
  selectedGroundPointIndex: number | null;
  selectedVoidSpanId: string | null;
  setGroundEditorEnabled: Dispatch<SetStateAction<boolean>>;
  setTerrainEditMode: (mode: TerrainEditMode) => void;
  setSelectedGroundPointIndex: (index: number | null) => void;
  setSelectedVoidSpanId: (id: string | null) => void;
};

export const useDesignerGroundActions = ({
  activeBoundaryKind,
  applyLevelDataUpdate,
  bottomThickness,
  levelData,
  selectedGroundPointIndex,
  selectedVoidSpanId,
  setGroundEditorEnabled,
  setTerrainEditMode,
  setSelectedGroundPointIndex,
  setSelectedVoidSpanId,
}: UseDesignerGroundActionsParams) => {
  const resetGroundSelection = () => {
    setSelectedGroundPointIndex(null);
    setSelectedVoidSpanId(null);
  };

  const handleTerrainEditModeChange = (nextTerrainEditMode: TerrainEditMode) => {
    setTerrainEditMode(nextTerrainEditMode);
    resetGroundSelection();
  };

  const handleToggleGroundEditor = () => {
    setGroundEditorEnabled((current) => !current);
    resetGroundSelection();
  };

  const handleTerrainBoundaryTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value as "line" | "bezier";
    applyLevelDataUpdate((current) => setTerrainBoundaryType(current, activeBoundaryKind, nextType));
  };

  const updateCeilingBoundary = (updater: (current: LevelData) => LevelData) => {
    applyLevelDataUpdate((current) => updater(current));
    setSelectedGroundPointIndex(null);
  };

  const handleCreateCeilingBoundary = () => {
    updateCeilingBoundary(ensureTerrainCeilingBoundary);
  };

  const handleDeleteCeilingBoundary = () => {
    updateCeilingBoundary(clearTerrainCeilingBoundary);
  };

  const handleGenerateGroundFromCeiling = () => {
    applyLevelDataUpdate((current) => {
      const currentTerrain = getLevelTerrain(current);
      if (!currentTerrain.ceilingBoundary) {
        return current;
      }
      return {
        ...current,
        ground: currentTerrain.groundBoundary,
        terrain: {
          ...currentTerrain,
          groundBoundary: createBottomBoundaryFromTop(current, currentTerrain.ceilingBoundary, bottomThickness),
        },
      };
    });
  };

  const moveGroundPoint = (direction: "left" | "right") => {
    if (selectedGroundPointIndex === null) {
      return;
    }
    const reordered = reorderTerrainBoundaryPoint(levelData, activeBoundaryKind, selectedGroundPointIndex, direction);
    applyLevelDataUpdate(reordered.levelData);
    setSelectedGroundPointIndex(reordered.pointIndex);
  };

  const handleMoveGroundPointForward = () => {
    moveGroundPoint("left");
  };

  const handleMoveGroundPointBackward = () => {
    moveGroundPoint("right");
  };

  const handleRemoveGroundPoint = () => {
    if (selectedGroundPointIndex === null) {
      return;
    }
    const removed = removeTerrainBoundaryPoint(levelData, activeBoundaryKind, selectedGroundPointIndex);
    applyLevelDataUpdate(removed.levelData);
    setSelectedGroundPointIndex(removed.nextSelectedPointIndex);
  };

  const handleRemoveVoidSpan = () => {
    if (!selectedVoidSpanId) {
      return;
    }
    const voidSpanId = selectedVoidSpanId;
    applyLevelDataUpdate((current) => removeTerrainVoidSpan(current, voidSpanId));
    setSelectedVoidSpanId(null);
  };

  return {
    handleTerrainBoundaryTypeChange,
    handleTerrainEditModeChange,
    handleToggleGroundEditor,
    handleCreateCeilingBoundary,
    handleDeleteCeilingBoundary,
    handleGenerateGroundFromCeiling,
    handleMoveGroundPointForward,
    handleMoveGroundPointBackward,
    handleRemoveGroundPoint,
    handleRemoveVoidSpan,
  };
};
