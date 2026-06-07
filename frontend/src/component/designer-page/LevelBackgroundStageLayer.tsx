import { LevelBackgroundPreview } from "../director/LevelBackgroundPreview.js";
import type { LevelBackgroundTemplate } from "../../objects/level/level-background-template.js";
import type { StretchVisualDesign } from "../../objects/ui-customization/ui-customization-objects.js";

type LevelBackgroundStageLayerProps = {
  template: LevelBackgroundTemplate;
  panelBackgroundDesign?: StretchVisualDesign | null;
  cloudPatternDesigns?: StretchVisualDesign[];
  width: number;
  height: number;
};

export const LevelBackgroundStageLayer = ({
  template,
  panelBackgroundDesign = null,
  cloudPatternDesigns = [],
  width,
  height,
}: LevelBackgroundStageLayerProps) => (
  <div className="designer-level-background-layer" aria-hidden="true">
    <LevelBackgroundPreview
      template={template}
      panelBackgroundDesign={panelBackgroundDesign}
      cloudPatternDesigns={cloudPatternDesigns}
      width={width}
      height={height}
      className="designer-level-background-stage-preview"
    />
  </div>
);
