import type { CSSProperties, PointerEvent } from "react";
import {
  getArtTextLayerFrameBoxStyle,
  getArtTextLayerLabel,
  getArtTextLayerStyle,
  getButtonStateHasPatternLayers,
  getPatternLayerFrame,
  getPatternLayerFrameBoxStyle,
  normalizeButtonStatePatternLayerDrafts,
  usesPatternLayerImage,
} from "../../../../../lib/button-pattern-layers.js";
import {
  getButtonBaseDesignStyle,
  getStretchVisualDesignStyle,
} from "../../../../../components/ui-renderer/ui-renderer-utils.js";
import type { PanelDecoration } from "../../../../../objects/ui-customization/ui-customization-objects.js";
import type { ButtonStateDraft, ResizeHandle } from "../../objects/panel-create-types.js";
import { getButtonStateContentType } from "../../function/panel-create-helpers.js";

export const PanelCreateChildOutline = ({ childId }: { childId: string }) => (
  <div
    className="panel-create-node-outline state-selected"
    data-panel-create-outline-id={childId}
    aria-hidden="true"
  >
    <span className="panel-create-corner top-left" data-panel-create-resize-handle="top-left" />
    <span className="panel-create-corner top-right" data-panel-create-resize-handle="top-right" />
    <span className="panel-create-corner bottom-left" data-panel-create-resize-handle="bottom-left" />
    <span className="panel-create-corner bottom-right" data-panel-create-resize-handle="bottom-right" />
  </div>
);

export const renderPanelBackgroundLayer = (decoration: PanelDecoration) =>
  decoration.backgroundDesign ? (
    <span
      className="panel-create-background-layer dynamic-ui-panel-background"
      style={getStretchVisualDesignStyle(decoration.backgroundDesign)}
      aria-hidden="true"
    />
  ) : null;

export const getButtonStatePreviewClassName = (state: ButtonStateDraft) => {
  const baseId = state.baseDesign ? "library" : "rounded";
  const patternId = getButtonStateHasPatternLayers(state) ? "library" : "none";
  return `${state.variant} base-${baseId} pattern-${patternId}`;
};

export const getButtonPreviewStyle = (state: ButtonStateDraft, positionStyle?: CSSProperties): CSSProperties => ({
  ...(positionStyle ?? {}),
  ...(state.baseDesign
    ? { backgroundColor: "#ffffff", borderColor: "transparent", borderRadius: 0, padding: 0 }
    : { backgroundColor: state.backgroundColor, color: state.textColor, borderRadius: 12 }),
});

export const renderButtonPreviewLayers = (
  state: ButtonStateDraft,
  options?: {
    patternAdjustable?: boolean;
    activeLayerId?: string;
    onPatternMovePointerDown?: (layerId: string) => (event: PointerEvent<HTMLSpanElement>) => void;
    onPatternResizePointerDown?: (layerId: string, handle: ResizeHandle) => (event: PointerEvent<HTMLSpanElement>) => void;
  },
) => {
  const layers = normalizeButtonStatePatternLayerDrafts(state);
  const activeLayerId = options?.activeLayerId ?? layers[layers.length - 1]?.id;

  return (
    <>
      {state.baseDesign ? (
        <span
          className="dynamic-ui-button-base"
          style={getButtonBaseDesignStyle(state.baseDesign)}
          aria-hidden="true"
        >
          {state.baseDesign.scalingMode === "fixedAspect" ? <img src={state.baseDesign.sourceDataUrl} alt="" /> : null}
        </span>
      ) : null}
      {layers.map((layer, index) => {
        if (!layer.design && layer.kind !== "artText") {
          return null;
        }

        const frame = getPatternLayerFrame(layer);
        const isActive = options?.patternAdjustable && layer.id === activeLayerId;
        const usesImage = usesPatternLayerImage(layer);
        const artTextLabel = getArtTextLayerLabel(layer, state.label);

        return (
          <span
            key={layer.id}
            className={`panel-create-button-pattern-frame dynamic-ui-button-pattern-layer ${usesImage ? "" : "dynamic-ui-button-art-text-frame"} ${isActive ? "selected" : ""}`}
            style={usesImage ? getPatternLayerFrameBoxStyle(frame, index) : getArtTextLayerFrameBoxStyle(frame, index)}
            aria-hidden="true"
          >
            {usesImage ? (
              <span
                className={`dynamic-ui-button-pattern ${isActive ? "panel-create-button-pattern-draggable" : ""}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: layer.design ? `url("${layer.design.sourceDataUrl}")` : undefined,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                }}
                onPointerDown={isActive ? options?.onPatternMovePointerDown?.(layer.id) : undefined}
              />
            ) : (
              <span
                className={`dynamic-ui-button-art-text ${isActive ? "panel-create-button-pattern-draggable" : ""}`}
                style={{
                  ...getArtTextLayerStyle({ textColor: state.textColor }),
                  ...(isActive ? { touchAction: "none" as const } : {}),
                }}
                onPointerDown={isActive ? options?.onPatternMovePointerDown?.(layer.id) : undefined}
              >
                {artTextLabel}
              </span>
            )}
            {isActive
              ? (["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((handle) => (
                  <span
                    key={handle}
                    className={`panel-create-pattern-frame-handle ${handle}`}
                    onPointerDown={options?.onPatternResizePointerDown?.(layer.id, handle)}
                  />
                ))
              : null}
          </span>
        );
      })}
    </>
  );
};

export const renderButtonPreviewContent = (state: ButtonStateDraft, label?: string) => {
  if (getButtonStateContentType(state) === "pattern" && getButtonStateHasPatternLayers(state)) {
    return null;
  }

  return (
    <span className="dynamic-ui-button-content">
      {state.icon ? <span className="dynamic-ui-button-icon">{state.icon}</span> : null}
      <span>{label ?? state.label}</span>
    </span>
  );
};
