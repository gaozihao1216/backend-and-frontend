import { LevelEditorCanvas } from "../../../../../component/designer/LevelEditorCanvas.js";
import { SelectedEntityPanel } from "../../../../../component/designer/SelectedEntityPanel.js";
import type { EditorTool } from "../../../../../lib/designer-level.js";
import type { GroundStrokeSimplifyConfig, TerrainEditMode } from "../../../../../lib/ground.js";
import type { LevelData } from "../../../../../objects/level/level/level-data.js";
import type { LevelBackgroundTemplate } from "../../../../../objects/level/level-background-template.js";
import type { StretchVisualDesign } from "../../../../../objects/ui-customization/ui-customization-objects.js";
import type { DesignerPhase } from "../../../../../objects/designer-page/designer-page-types.js";
import { DesignerWorkspace } from "./DesignerWorkspace.js";

type DesignerCanvasPanelProps = {
  activeTool: EditorTool;
  levelData: LevelData;
  editorPhase: DesignerPhase;
  selectedEntityIds: string[];
  primarySelectedEntityId: string | null;
  onChange: (nextLevelData: LevelData) => void;
  onSelectionChange: (entityIds: string[], primaryEntityId: string | null) => void;
  onToolChange: (tool: EditorTool) => void;
  onPointerWorldChange: (point: { x: number; y: number } | null) => void;
  gridVisible: boolean;
  gridSnapEnabled: boolean;
  gridSize: number;
  isSnapTemporarilyDisabled: boolean;
  groupSelectionRotationAngle: number;
  onGroupSelectionRotationAngleChange: (angle: number) => void;
  groupSelectionCenter: { x: number; y: number } | null;
  onGroupSelectionCenterChange: (center: { x: number; y: number } | null) => void;
  groupSelectionSize: { width: number; height: number } | null;
  onGroupSelectionSizeChange: (size: { width: number; height: number } | null) => void;
  groundEditEnabled: boolean;
  terrainEditMode: TerrainEditMode;
  groundStrokeSimplifyConfig: GroundStrokeSimplifyConfig;
  selectedGroundPointIndex: number | null;
  onGroundPointSelectionChange: (pointIndex: number | null) => void;
  selectedVoidSpanId: string | null;
  onVoidSpanSelectionChange: (voidSpanId: string | null) => void;
  entityEditingEnabled: boolean;
  levelBackgroundTemplate?: LevelBackgroundTemplate | null;
  levelBackgroundPanelDesign?: StretchVisualDesign | null;
  levelBackgroundCloudDesigns?: StretchVisualDesign[];
};

export const DesignerCanvasPanel = ({
  activeTool,
  levelData,
  editorPhase,
  selectedEntityIds,
  primarySelectedEntityId,
  onChange,
  onSelectionChange,
  onToolChange,
  onPointerWorldChange,
  gridVisible,
  gridSnapEnabled,
  gridSize,
  isSnapTemporarilyDisabled,
  groupSelectionRotationAngle,
  onGroupSelectionRotationAngleChange,
  groupSelectionCenter,
  onGroupSelectionCenterChange,
  groupSelectionSize,
  onGroupSelectionSizeChange,
  groundEditEnabled,
  terrainEditMode,
  groundStrokeSimplifyConfig,
  selectedGroundPointIndex,
  onGroundPointSelectionChange,
  selectedVoidSpanId,
  onVoidSpanSelectionChange,
  entityEditingEnabled,
  levelBackgroundTemplate = null,
  levelBackgroundPanelDesign = null,
  levelBackgroundCloudDesigns = [],
}: DesignerCanvasPanelProps) => (
  <DesignerWorkspace>
      <LevelEditorCanvas
        activeTool={activeTool}
        levelData={levelData}
        editorPhase={editorPhase}
        selectedEntityIds={selectedEntityIds}
        primarySelectedEntityId={primarySelectedEntityId}
        onChange={onChange}
        onSelectionChange={onSelectionChange}
        onToolChange={onToolChange}
        onPointerWorldChange={onPointerWorldChange}
        gridVisible={gridVisible}
        gridSnapEnabled={gridSnapEnabled}
        gridSize={gridSize}
        isSnapTemporarilyDisabled={isSnapTemporarilyDisabled}
        groupSelectionRotationAngle={groupSelectionRotationAngle}
        onGroupSelectionRotationAngleChange={onGroupSelectionRotationAngleChange}
        groupSelectionCenter={groupSelectionCenter}
        onGroupSelectionCenterChange={onGroupSelectionCenterChange}
        groupSelectionSize={groupSelectionSize}
        onGroupSelectionSizeChange={onGroupSelectionSizeChange}
        groundEditEnabled={groundEditEnabled}
        terrainEditMode={terrainEditMode}
        groundStrokeSimplifyConfig={groundStrokeSimplifyConfig}
        selectedGroundPointIndex={selectedGroundPointIndex}
        onGroundPointSelectionChange={onGroundPointSelectionChange}
        selectedVoidSpanId={selectedVoidSpanId}
        onVoidSpanSelectionChange={onVoidSpanSelectionChange}
        entityEditingEnabled={entityEditingEnabled}
        levelBackgroundTemplate={levelBackgroundTemplate}
        levelBackgroundPanelDesign={levelBackgroundPanelDesign}
        levelBackgroundCloudDesigns={levelBackgroundCloudDesigns}
      />
      {editorPhase === "entities" ? (
        <SelectedEntityPanel
          levelData={levelData}
          selectedEntityIds={selectedEntityIds}
          primarySelectedEntityId={primarySelectedEntityId}
        />
      ) : null}
  </DesignerWorkspace>
);
