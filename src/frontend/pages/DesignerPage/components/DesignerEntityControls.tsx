import { EditorToolbar } from "../../../components/designer/EditorToolbar.js";
import { RotationKnob } from "../../../components/designer/RotationKnob.js";
import type { EditorTool } from "../../../lib/designer-level.js";

type DesignerEntityControlsProps = {
  activeTool: EditorTool;
  rotationAngle: number;
  rotationDisabled: boolean;
  onToolChange: (tool: EditorTool) => void;
  onRotationAngleChange: (angle: number) => void;
};

export const DesignerEntityControls = ({
  activeTool,
  rotationAngle,
  rotationDisabled,
  onToolChange,
  onRotationAngleChange,
}: DesignerEntityControlsProps) => {
  return (
    <div className="designer-toolbar-row">
      <EditorToolbar activeTool={activeTool} onToolChange={onToolChange} />
      <div className="rotation-controls-panel">
        <div className="rotation-controls">
          <RotationKnob
            label="粗调"
            angle={rotationAngle}
            disabled={rotationDisabled}
            precisionMultiplier={1}
            variant="coarse"
            onChange={onRotationAngleChange}
          />
          <RotationKnob
            label="微调"
            angle={rotationAngle}
            disabled={rotationDisabled}
            precisionMultiplier={10}
            variant="fine"
            onChange={onRotationAngleChange}
          />
        </div>
        <div className="rotation-angle-readout">
          <strong>{Math.round((rotationAngle * 180) / Math.PI)}°</strong>
        </div>
      </div>
    </div>
  );
};
