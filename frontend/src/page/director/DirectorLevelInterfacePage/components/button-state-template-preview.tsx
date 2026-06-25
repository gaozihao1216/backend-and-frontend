import type { CSSProperties, PointerEvent } from "react";
import {
  getArtTextLayerFrameBoxStyle,
  getArtTextLayerLabel,
  getArtTextLayerStyle,
  getButtonStateContentType,
  getButtonStateHasPatternLayers,
  getPatternLayerFrame,
  getPatternLayerFrameBoxStyle,
  normalizeButtonStatePatternLayerDrafts,
  usesPatternLayerImage,
  type ButtonPatternLayerDraft,
} from "../../../shared/function/ui-design/button-pattern-layers.js";
import { getTemplateButtonShellStyle } from "../../../shared/components/ui-renderer/ui-renderer-utils.js";
import { ProcessedTemplateBackground, ProcessedTemplateBase } from "../../../shared/components/ui-renderer/ProcessedTemplateImage.js";
import {
  LEVEL_NODE_BUTTON_MAX_FONT_SIZE,
  type LevelNodeSharedButtonDesign,
} from "../../../shared/function/level-map/level-node-button-format.js";

export type ButtonStateTemplatePreviewState = LevelNodeSharedButtonDesign & {
  icon?: string;
  label: string;
};

export const getButtonStateTemplatePreviewClassName = (state: ButtonStateTemplatePreviewState) =>
  `${state.variant} base-rounded pattern-none`;

export const getButtonStateTemplatePreviewStyle = (
  state: ButtonStateTemplatePreviewState,
  positionStyle?: CSSProperties,
): CSSProperties => ({
  ...(positionStyle ?? {}),
  ...(state.baseDesign
    ? getTemplateButtonShellStyle()
    : {
        backgroundColor: state.backgroundColor,
        color: state.textColor,
        borderRadius: state.borderRadius,
        fontSize: Math.min(LEVEL_NODE_BUTTON_MAX_FONT_SIZE, state.fontSize),
      }),
});

export const renderButtonStateTemplatePreviewLayers = (
  state: ButtonStateTemplatePreviewState,
) => {
  const layers = normalizeButtonStatePatternLayerDrafts(state);

  return (
    <>
      {state.baseDesign ? (
        <ProcessedTemplateBase baseDesign={state.baseDesign} />
      ) : null}
      {layers.map((layer, index) => {
        if (!layer.design && layer.kind !== "artText") {
          return null;
        }

        const frame = getPatternLayerFrame(layer);
        const usesImage = usesPatternLayerImage(layer);
        const artTextLabel = getArtTextLayerLabel(layer, state.label);

        return (
          <span
            key={layer.id}
            className={`panel-create-button-pattern-frame dynamic-ui-button-pattern-layer ${usesImage ? "" : "dynamic-ui-button-art-text-frame"}`}
            style={usesImage ? getPatternLayerFrameBoxStyle(frame, index) : getArtTextLayerFrameBoxStyle(frame, index)}
            aria-hidden="true"
          >
            {usesImage && layer.design ? (
              <ProcessedTemplateBackground
                sourceDataUrl={layer.design.sourceDataUrl}
                className="dynamic-ui-button-pattern"
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                }}
              />
            ) : usesImage ? (
              <span
                className="dynamic-ui-button-pattern"
                style={{
                  position: "absolute",
                  inset: 0,
                }}
              />
            ) : (
              <span
                className="dynamic-ui-button-art-text"
                style={getArtTextLayerStyle({ textColor: state.textColor })}
              >
                {artTextLabel}
              </span>
            )}
          </span>
        );
      })}
    </>
  );
};

export const renderButtonStateTemplatePreviewContent = (state: ButtonStateTemplatePreviewState) => {
  if (getButtonStateContentType(state) === "pattern" && getButtonStateHasPatternLayers(state)) {
    return null;
  }

  return (
    <span className="dynamic-ui-button-content">
      {state.icon ? <span className="dynamic-ui-button-icon">{state.icon}</span> : null}
      <span>{state.label}</span>
    </span>
  );
};

export const createPatternLayerFromTemplate = (
  templateValue: string,
  design: NonNullable<ButtonPatternLayerDraft["design"]>,
): ButtonPatternLayerDraft[] => ([
  {
    id: "layer-1",
    name: "图层 1",
    kind: "pattern",
    templateValue,
    design,
  },
]);
