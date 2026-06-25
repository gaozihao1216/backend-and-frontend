import type { ChangeEvent } from "react";
import type { LevelGround } from "../../../../../objects/level/terrain/level-ground.js";
import type { TerrainEditMode } from "../../../../../level/function/ground.js";

type GroundEditorToggleControlsProps = {
  terrainEditMode: TerrainEditMode;
  activeBoundary: LevelGround | null;
  groundEditorEnabled: boolean;
  onBoundaryTypeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onTerrainEditModeChange: (terrainEditMode: TerrainEditMode) => void;
  onToggleGroundEditor: () => void;
};

export const GroundEditorToggleControls = ({
  terrainEditMode,
  activeBoundary,
  groundEditorEnabled,
  onBoundaryTypeChange,
  onTerrainEditModeChange,
  onToggleGroundEditor,
}: GroundEditorToggleControlsProps) => (
  <div className="designer-grid-controls designer-ground-controls">
      <label className="designer-grid-size">
        <span>{terrainEditMode === "ceiling-boundary" ? "天花板类型" : "地面类型"}</span>
      <select
        value={activeBoundary?.type ?? "line"}
        onChange={onBoundaryTypeChange}
        disabled={terrainEditMode === "hollow" || !activeBoundary}
      >
        <option value="line">Line</option>
        <option value="bezier">Bezier</option>
      </select>
    </label>
    <div className="designer-mode-toggle">
      <button
        type="button"
        className={terrainEditMode === "ceiling-boundary" ? "" : "secondary"}
        onClick={() => onTerrainEditModeChange("ceiling-boundary")}
      >
        天花板编辑
      </button>
      <button
        type="button"
        className={terrainEditMode === "ground-boundary" ? "" : "secondary"}
        onClick={() => onTerrainEditModeChange("ground-boundary")}
      >
        地面编辑
      </button>
      <button
        type="button"
        className={terrainEditMode === "hollow" ? "" : "secondary"}
          onClick={() => onTerrainEditModeChange("hollow")}
        >
        悬崖虚空
      </button>
    </div>
    <button
      type="button"
      className="secondary"
      onClick={onToggleGroundEditor}
    >
      {groundEditorEnabled ? "结束地面编辑" : "编辑地面"}
    </button>
  </div>
);
