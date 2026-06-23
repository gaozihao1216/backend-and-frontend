import { CeilingControls } from "./CeilingControls.js";
import { GroundEditorToggleControls } from "./GroundEditorToggleControls.js";
import { GroundPointControls } from "./GroundPointControls.js";
import { VoidSpanControls } from "./VoidSpanControls.js";
import type { DesignerPageViewModel } from "../../../../../hook/designer-page/useDesignerPageViewModel.js";

type DesignerGroundControlsSectionProps = {
  groundEditor: DesignerPageViewModel["groundEditor"];
  groundActions: DesignerPageViewModel["groundActions"];
};

export const DesignerGroundControlsSection = ({
  groundEditor,
  groundActions,
}: DesignerGroundControlsSectionProps) => {
  if (groundEditor.designerPhase !== "ground") {
    return null;
  }

  return (
    <>
      <GroundEditorToggleControls
        terrainEditMode={groundEditor.terrainEditMode}
        activeBoundary={groundEditor.activeBoundary}
        groundEditorEnabled={groundEditor.groundEditorEnabled}
        onBoundaryTypeChange={groundActions.handleTerrainBoundaryTypeChange}
        onTerrainEditModeChange={groundActions.handleTerrainEditModeChange}
        onToggleGroundEditor={groundActions.handleToggleGroundEditor}
      />
      <CeilingControls
        showCeilingBoundaryControls={groundEditor.groundEditorEnabled && groundEditor.terrainEditMode === "ceiling-boundary"}
        showGenerateGroundControl={groundEditor.groundEditorEnabled}
        hasCeilingBoundary={!!groundEditor.terrain.ceilingBoundary}
        bottomThicknessControl={(
          <label className="designer-grid-size">
            <span>默认厚度</span>
            <input
              type="range"
              min={48}
              max={220}
              step={4}
              value={groundEditor.bottomThickness}
              onChange={(event) => groundEditor.setBottomThickness(Number(event.target.value))}
            />
            <strong>{groundEditor.bottomThickness}</strong>
          </label>
        )}
        onCreateCeilingBoundary={groundActions.handleCreateCeilingBoundary}
        onDeleteCeilingBoundary={groundActions.handleDeleteCeilingBoundary}
        onGenerateGroundFromCeiling={groundActions.handleGenerateGroundFromCeiling}
      />
      <GroundPointControls
        visible={groundEditor.groundEditorEnabled && groundEditor.terrainEditMode !== "hollow"}
        selectedGroundPointIndex={groundEditor.selectedGroundPointIndex}
        activeBoundary={groundEditor.activeBoundary}
        onMoveGroundPointForward={groundActions.handleMoveGroundPointForward}
        onMoveGroundPointBackward={groundActions.handleMoveGroundPointBackward}
        onRemoveGroundPoint={groundActions.handleRemoveGroundPoint}
      />
      <VoidSpanControls
        visible={groundEditor.groundEditorEnabled && groundEditor.terrainEditMode === "hollow"}
        selectedVoidSpanId={groundEditor.selectedVoidSpanId}
        onRemoveVoidSpan={groundActions.handleRemoveVoidSpan}
      />
    </>
  );
};
