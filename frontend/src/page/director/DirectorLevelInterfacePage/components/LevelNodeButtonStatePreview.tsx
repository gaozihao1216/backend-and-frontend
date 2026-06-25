import { useRef, useState, type PointerEvent } from "react";
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
} from "../../../shared/function/ui-design/button-pattern-layers.js";
import {
  movePatternFrame,
  PATTERN_LAYER_RESIZE_HANDLES,
  resizePatternFrame,
  type PatternLayerResizeHandle,
} from "../../../shared/function/ui-design/pattern-frame-adjust.js";
import { LEVEL_NODE_BUTTON_MAX_FONT_SIZE } from "../../../shared/function/level-map/level-node-button-format.js";
import { getTemplateButtonShellStyle } from "../../../shared/components/ui-renderer/ui-renderer-utils.js";
import { ProcessedTemplateBackground, ProcessedTemplateBase } from "../../../shared/components/ui-renderer/ProcessedTemplateImage.js";
import type { ButtonStateTemplatePreviewState } from "./button-state-template-preview.js";

type LevelNodeButtonStatePreviewProps = {
  state: ButtonStateTemplatePreviewState;
  disabled?: boolean;
  editable?: boolean;
  onPatternLayerFrameChange?: (layerId: string, frame: ReturnType<typeof getPatternLayerFrame>) => void;
};

type PatternAdjustSession = {
  mode: "move" | "resize";
  layerId: string;
  handle?: PatternLayerResizeHandle;
  pointerId: number;
  startX: number;
  startY: number;
  startFrame: ReturnType<typeof getPatternLayerFrame>;
  stageWidth: number;
  stageHeight: number;
};

export const LevelNodeButtonStatePreview = ({
  state,
  disabled = false,
  editable = false,
  onPatternLayerFrameChange,
}: LevelNodeButtonStatePreviewProps) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const adjustRef = useRef<PatternAdjustSession | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const layers = normalizeButtonStatePatternLayerDrafts(state);
  const isPatternContent = getButtonStateContentType(state) === "pattern"
    && getButtonStateHasPatternLayers(state);
  const selectedLayerId = activeLayerId ?? layers[layers.length - 1]?.id ?? null;

  const previewStyle = {
    position: "relative" as const,
    width: "100%",
    minHeight: "120px",
    ...(state.baseDesign
      ? getTemplateButtonShellStyle()
      : {
          backgroundColor: state.backgroundColor,
          color: state.textColor,
          borderRadius: state.borderRadius,
          fontSize: Math.min(LEVEL_NODE_BUTTON_MAX_FONT_SIZE, state.fontSize),
        }),
  };

  const beginAdjust = (
    layerId: string,
    event: PointerEvent<HTMLSpanElement>,
    mode: "move" | "resize",
    handle?: PatternLayerResizeHandle,
  ) => {
    if (!editable || !onPatternLayerFrameChange || event.button !== 0) {
      return;
    }

    const stage = stageRef.current;
    const layer = layers.find((candidate) => candidate.id === layerId);
    if (!stage || !layer) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    setActiveLayerId(layerId);
    const rect = stage.getBoundingClientRect();
    const startFrame = getPatternLayerFrame(layer);
    adjustRef.current = {
      mode,
      layerId,
      ...(handle ? { handle } : {}),
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startFrame,
      stageWidth: rect.width,
      stageHeight: rect.height,
    };
    stage.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const adjust = adjustRef.current;
    if (!adjust || adjust.pointerId !== event.pointerId || !onPatternLayerFrameChange) {
      return;
    }

    const deltaX = ((event.clientX - adjust.startX) / adjust.stageWidth) * 100;
    const deltaY = ((event.clientY - adjust.startY) / adjust.stageHeight) * 100;
    const nextFrame = adjust.mode === "move"
      ? movePatternFrame(adjust.startFrame, deltaX, deltaY)
      : resizePatternFrame(adjust.startFrame, adjust.handle ?? "bottom-right", deltaX, deltaY);

    onPatternLayerFrameChange(adjust.layerId, nextFrame);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    adjustRef.current = null;
    const stage = stageRef.current;
    if (stage?.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={stageRef}
      className={`level-interface-button-format-preview-stage level-interface-button-state-preview-stage ${editable ? "is-editable" : ""}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <button
        type="button"
        className={`dynamic-ui-button panel-create-button-state-sample ${state.baseDesign ? "uses-template-base" : ""} ${state.variant} base-rounded pattern-none`}
        style={previewStyle}
        disabled={disabled}
      >
        {state.baseDesign ? (
          <ProcessedTemplateBase baseDesign={state.baseDesign} />
        ) : null}

        {layers.map((layer, index) => {
          if (!layer.design && layer.kind !== "artText") {
            return null;
          }

          const frame = getPatternLayerFrame(layer);
          const isActive = editable && layer.id === selectedLayerId;
          const usesImage = usesPatternLayerImage(layer);
          const artTextLabel = getArtTextLayerLabel(layer, state.label);

          return (
            <span
              key={layer.id}
              className={`panel-create-button-pattern-frame dynamic-ui-button-pattern-layer ${usesImage ? "" : "dynamic-ui-button-art-text-frame"} ${isActive ? "selected" : ""}`}
              style={usesImage ? getPatternLayerFrameBoxStyle(frame, index) : getArtTextLayerFrameBoxStyle(frame, index)}
              aria-hidden="true"
            >
              {usesImage && layer.design ? (
                <ProcessedTemplateBackground
                  sourceDataUrl={layer.design.sourceDataUrl}
                  className={`dynamic-ui-button-pattern ${isActive ? "panel-create-button-pattern-draggable" : ""}`}
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%",
                  }}
                  {...(isActive
                    ? { onPointerDown: (event) => beginAdjust(layer.id, event, "move") }
                    : {})}
                />
              ) : usesImage ? (
                <span
                  className={`dynamic-ui-button-pattern ${isActive ? "panel-create-button-pattern-draggable" : ""}`}
                  style={{
                    position: "absolute",
                    inset: 0,
                  }}
                />
              ) : (
                <span
                  className={`dynamic-ui-button-art-text ${isActive ? "panel-create-button-pattern-draggable" : ""}`}
                  style={{
                    ...getArtTextLayerStyle({ textColor: state.textColor }),
                    ...(isActive ? { touchAction: "none" as const } : {}),
                  }}
                  onPointerDown={isActive ? (event) => beginAdjust(layer.id, event, "move") : undefined}
                >
                  {artTextLabel}
                </span>
              )}
              {isActive
                ? PATTERN_LAYER_RESIZE_HANDLES.map((handle) => (
                    <span
                      key={handle}
                      className={`panel-create-pattern-frame-handle ${handle}`}
                      onPointerDown={(event) => beginAdjust(layer.id, event, "resize", handle)}
                    />
                  ))
                : null}
            </span>
          );
        })}

        {!isPatternContent ? (
          <span className="dynamic-ui-button-content">
            {state.icon ? <span className="dynamic-ui-button-icon">{state.icon}</span> : null}
            <span>{state.label}</span>
          </span>
        ) : null}
      </button>
    </div>
  );
};
