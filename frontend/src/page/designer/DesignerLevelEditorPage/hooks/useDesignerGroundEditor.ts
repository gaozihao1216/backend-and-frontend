import { useState } from "react";
import { getLevelTerrain, type TerrainEditMode, type TerrainBoundaryKind } from "../../../../level/function/ground.js";
import type { LevelData } from "../../../../objects/level/level/level-data.js";
import type { LevelGround } from "../../../../objects/level/terrain/level-ground.js";
import type { LevelTerrain } from "../../../../objects/level/terrain/level-terrain.js";
import type { DesignerPhase } from "../objects/designer-level-editor-page-types.js";

export type UseDesignerGroundEditorParams = {
  levelData: LevelData;
};

/**
 * 管理地形编辑器状态。
 *
 * 地形编辑与实体编辑分离：这里只维护地面/天花板边界、空洞选择、
 * 当前地形模式和从天花板生成地面的厚度参数。
 */
export const useDesignerGroundEditor = ({ levelData }: UseDesignerGroundEditorParams) => {
  const [designerPhase, setDesignerPhase] = useState<DesignerPhase>("ground");
  const [groundEditorEnabled, setGroundEditorEnabled] = useState(true);
  const [terrainEditMode, setTerrainEditMode] = useState<TerrainEditMode>("ground-boundary");
  const [bottomThickness, setBottomThickness] = useState(96);
  const [selectedGroundPointIndex, setSelectedGroundPointIndex] = useState<number | null>(null);
  const [selectedVoidSpanId, setSelectedVoidSpanId] = useState<string | null>(null);

  const terrain: LevelTerrain = getLevelTerrain(levelData);
  // 当前激活边界由模式决定，组件层可以统一读取 activeBoundary 进行绘制和控制。
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
