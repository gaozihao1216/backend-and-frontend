import type { ButtonPatternLayer, ButtonStateOption, ComponentStyle } from "../../objects/ui-customization/ui-customization-objects.js";
import {
  getArtTextLayerFrameBoxStyle,
  getArtTextLayerLabel,
  getArtTextLayerStyle,
  getPatternLayerFrame,
  getPatternLayerFrameBoxStyle,
  normalizeButtonStatePatternLayers,
  usesPatternLayerImage,
} from "../../lib/button-pattern-layers.js";

type ButtonPatternLayersProps = {
  state: Pick<ButtonStateOption, "patternDesign" | "patternLayers" | "label" | "style">;
  label: string;
};

export const ButtonPatternLayers = ({ state, label }: ButtonPatternLayersProps) => {
  const layers = normalizeButtonStatePatternLayers(state);
  const stateStyle = state.style;

  return layers.map((layer, index) => (
    <ButtonPatternLayerView
      key={layer.id}
      layer={layer}
      stackIndex={index}
      label={label}
      stateStyle={stateStyle}
    />
  ));
};

type ButtonPatternLayerViewProps = {
  layer: ButtonPatternLayer;
  stackIndex: number;
  label: string;
  stateStyle?: ComponentStyle;
};

const ButtonPatternLayerView = ({ layer, stackIndex, label, stateStyle }: ButtonPatternLayerViewProps) => {
  const frame = getPatternLayerFrame(layer);
  const usesImage = usesPatternLayerImage(layer);
  const artTextLabel = getArtTextLayerLabel(layer, label);
  const frameStyle = usesImage
    ? getPatternLayerFrameBoxStyle(frame, stackIndex)
    : getArtTextLayerFrameBoxStyle(frame, stackIndex);

  return (
    <span
      className={`dynamic-ui-button-pattern-layer ${usesImage ? "" : "dynamic-ui-button-art-text-frame"}`}
      style={frameStyle}
      aria-hidden="true"
    >
      {usesImage ? (
        <span
          className="dynamic-ui-button-pattern"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("${layer.design.sourceDataUrl}")`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
          }}
        />
      ) : (
        <span className="dynamic-ui-button-art-text" style={getArtTextLayerStyle(stateStyle)}>
          {artTextLabel}
        </span>
      )}
    </span>
  );
};
