import { removeTerrainBoundaryPoint, removeTerrainVoidSpan, type TerrainBoundaryKind, type TerrainEditMode } from "../../../../../level/function/ground.js";
import type { LevelData } from "../../../../../objects/level/level/level-data.js";

export type HandleGroundEditorDeleteParams = {
  groundEditorEnabled: boolean;
  terrainEditMode: TerrainEditMode;
  selectedVoidSpanId: string | null;
  selectedGroundPointIndex: number | null;
  activeBoundaryKind: TerrainBoundaryKind;
  levelData: LevelData;
  applyLevelDataUpdate: (updater: LevelData | ((current: LevelData) => LevelData)) => void;
  setSelectedVoidSpanId: (value: string | null) => void;
  setSelectedGroundPointIndex: (value: number | null) => void;
};

export const handleGroundEditorDelete = (params: HandleGroundEditorDeleteParams): boolean => {
  const {
    groundEditorEnabled,
    terrainEditMode,
    selectedVoidSpanId,
    selectedGroundPointIndex,
    activeBoundaryKind,
    levelData,
    applyLevelDataUpdate,
    setSelectedVoidSpanId,
    setSelectedGroundPointIndex,
  } = params;

  if (groundEditorEnabled && terrainEditMode === "hollow" && selectedVoidSpanId) {
    const voidSpanId = selectedVoidSpanId;
    applyLevelDataUpdate((current) => removeTerrainVoidSpan(current, voidSpanId));
    setSelectedVoidSpanId(null);
    return true;
  }

  if (groundEditorEnabled && selectedGroundPointIndex !== null && terrainEditMode !== "hollow") {
    const removed = removeTerrainBoundaryPoint(levelData, activeBoundaryKind, selectedGroundPointIndex);
    applyLevelDataUpdate(removed.levelData);
    setSelectedGroundPointIndex(removed.nextSelectedPointIndex);
    return true;
  }

  return false;
};
