import { useState } from "react";
import { getLevelTerrain, type TerrainEditMode, type TerrainBoundaryKind } from "../../lib/ground.js";
import type { LevelData, LevelGround, LevelTerrain } from "../../lib/level-contracts.js";
import type { DesignerPhase } from "../../objects/designer-page/designer-page-types.js";

export type UseDesignerGroundEditorParams = {
  levelData: LevelData;
};

export const useDesignerGroundEditor = ({ levelData }: UseDesignerGroundEditorParams) => {
  const [designerPhase, setDesignerPhase] = useState<DesignerPhase>("ground");
  const [groundEditorEnabled, setGroundEditorEnabled] = useState(true);
  const [terrainEditMode, setTerrainEditMode] = useState<TerrainEditMode>("ground-boundary");
  const [bottomThickness, setBottomThickness] = useState(96);
  const [selectedGroundPointIndex, setSelectedGroundPointIndex] = useState<number | null>(null);
  const [selectedVoidSpanId, setSelectedVoidSpanId] = useState<string | null>(null);

  const terrain: LevelTerrain = getLevelTerrain(levelData);
  const activeBoundaryKind: TerrainBoundaryKind = terrainEditMode === "ceiling-boundary" ? "ceiling" : "ground";
  const activeBoundary: LevelGround | null = activeBoundaryKind === "ceiling" ? terrain.ceilingBoundary ?? null : terrain.groundBoundary;

  const resetGroundSelection = () => {
    setSelectedGroundPointIndex(null);
    setSelectedVoidSpanId(null);
  };

  return {
    designerPhase,
    setDesignerPhase,
    groundEditorEnabled,
    setGroundEditorEnabled,
    terrainEditMode,
    setTerrainEditMode,
    bottomThickness,
    setBottomThickness,
    selectedGroundPointIndex,
    setSelectedGroundPointIndex,
    selectedVoidSpanId,
    setSelectedVoidSpanId,
    terrain,
    activeBoundaryKind,
    activeBoundary,
    resetGroundSelection,
  };
};
