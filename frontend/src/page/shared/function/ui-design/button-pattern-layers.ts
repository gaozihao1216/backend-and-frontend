import type { CSSProperties } from "react";
import type {
  ButtonImageFrame,
  ButtonPatternLayer,
  ButtonPatternLayerKind,
  ButtonStateOption,
  ComponentStyle,
  StretchVisualDesign,
} from "../../../../objects/ui-customization/ui-customization-objects.js";

const DEFAULT_PATTERN_LAYER_FRAME: ButtonImageFrame = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

export type PatternLayerResizeHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type ButtonPatternLayerDraft = {
  id: string;
  name: string;
  kind: ButtonPatternLayerKind;
  templateValue: string;
  design?: StretchVisualDesign;
  artTextLabel?: string;
};

export type ButtonStatePatternSource = Pick<ButtonStateOption, "patternDesign" | "patternLayers">;

export type ButtonStatePatternDraftSource = {
  patternDesign?: StretchVisualDesign;
  patternLayers?: ButtonPatternLayerDraft[];
  patternTemplateValue?: string;
};

export const createEmptyPatternLayerDraft = (index: number): ButtonPatternLayerDraft => ({
  id: `layer-${index}-${Date.now().toString(36)}`,
  name: `图层 ${index}`,
  kind: "pattern",
  templateValue: "",
});

export const CSS_ART_TEXT_TEMPLATE_ID = "css-art-text";
export const CSS_ART_TEXT_DATA_URL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export const createDefaultArtTextLayerDraft = (index: number, label = ""): ButtonPatternLayerDraft => ({
  id: `layer-${index}-${Date.now().toString(36)}`,
  name: `艺术字 ${index}`,
  kind: "artText",
  templateValue: "",
  artTextLabel: label,
  design: {
    templateId: CSS_ART_TEXT_TEMPLATE_ID,
    sourceDataUrl: CSS_ART_TEXT_DATA_URL,
    frame: { x: 12, y: 28, width: 76, height: 44 },
  },
});

export const isArtTextCssLayer = (
  layer: Pick<ButtonPatternLayer, "kind" | "design"> | ButtonPatternLayerDraft,
): boolean =>
  layer.kind === "artText"
  && (layer.design?.templateId === CSS_ART_TEXT_TEMPLATE_ID || !layer.design);

export const usesPatternLayerImage = (
  layer: Pick<ButtonPatternLayer, "kind" | "design"> | ButtonPatternLayerDraft,
): boolean => layer.kind === "pattern" || (layer.kind === "artText" && Boolean(layer.design) && !isArtTextCssLayer(layer));

export const getPatternLayerFrame = (layer: Pick<ButtonPatternLayer, "design"> | ButtonPatternLayerDraft): ButtonImageFrame =>
  layer.design?.frame ?? DEFAULT_PATTERN_LAYER_FRAME;

export const getPatternLayerFrameBoxStyle = (frame: ButtonImageFrame, stackIndex: number): CSSProperties => ({
  position: "absolute",
  left: `${frame.x}%`,
  top: `${frame.y}%`,
  width: `${frame.width}%`,
  height: `${frame.height}%`,
  zIndex: 2 + stackIndex,
});

export const getArtTextLayerFrameBoxStyle = (frame: ButtonImageFrame, stackIndex: number): CSSProperties => ({
  ...getPatternLayerFrameBoxStyle(frame, stackIndex),
  containerType: "size",
  overflow: "hidden",
});

export const normalizeButtonStatePatternLayers = (state: ButtonStatePatternSource): ButtonPatternLayer[] => {
  if (state.patternLayers && state.patternLayers.length > 0) {
    return state.patternLayers;
  }

  if (state.patternDesign) {
    return [{
      id: "layer-1",
      name: "图层 1",
      kind: "pattern",
      design: state.patternDesign,
    }];
  }

  return [];
};

export const normalizeButtonStatePatternLayerDrafts = (state: ButtonStatePatternDraftSource): ButtonPatternLayerDraft[] => {
  if (state.patternLayers && state.patternLayers.length > 0) {
    return state.patternLayers;
  }

  if (state.patternDesign) {
    return [{
      id: "layer-1",
      name: "图层 1",
      kind: "pattern",
      templateValue: state.patternTemplateValue ?? "",
      design: state.patternDesign,
    }];
  }

  return [];
};

export const serializePatternLayersForStateOption = (
  layers: ButtonPatternLayerDraft[],
): ButtonPatternLayer[] | undefined => {
  const serialized: ButtonPatternLayer[] = [];

  layers.forEach((layer) => {
    if (layer.kind === "artText") {
      const frame = getPatternLayerFrame(layer);
      const design = layer.design ?? {
        templateId: CSS_ART_TEXT_TEMPLATE_ID,
        sourceDataUrl: CSS_ART_TEXT_DATA_URL,
        frame,
      };

      serialized.push({
        id: layer.id,
        name: layer.name,
        kind: layer.kind,
        design,
        ...(layer.artTextLabel ? { artTextLabel: layer.artTextLabel } : {}),
      });
      return;
    }

    if (!layer.design) {
      return;
    }

    serialized.push({
      id: layer.id,
      name: layer.name,
      kind: layer.kind,
      design: layer.design,
    });
  });

  return serialized.length > 0 ? serialized : undefined;
};

export const getButtonStateHasPatternLayers = (
  state: ButtonStatePatternSource | ButtonStatePatternDraftSource,
): boolean => normalizeButtonStatePatternLayerDrafts(state).some((layer) =>
  layer.kind === "artText" || Boolean(layer.design),
);

export const getButtonStateContentType = (
  state: ButtonStatePatternDraftSource & { contentType?: "text" | "pattern" },
): "text" | "pattern" =>
  state.contentType ?? (getButtonStateHasPatternLayers(state) ? "pattern" : "text");

export const getArtTextLayerLabel = (
  layer: Pick<ButtonPatternLayer, "kind" | "artTextLabel">,
  fallbackLabel: string,
): string => layer.artTextLabel?.trim() || fallbackLabel;

export const getArtTextLayerStyle = (
  style?: ComponentStyle,
  options?: { interactive?: boolean },
): CSSProperties => {
  const highlight = style?.textColor ?? "#ffd76a";

  return {
    boxSizing: "border-box",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.06em",
    fontWeight: 800,
    lineHeight: 1.05,
    textAlign: "center",
    letterSpacing: "0.04em",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflow: "hidden",
    fontSize: "min(78cqw, 88cqh)",
    background: `linear-gradient(180deg, #fffef5 0%, ${highlight} 52%, #c98a12 100%)`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    WebkitTextStroke: "0.045em rgba(18, 32, 47, 0.42)",
    filter: "drop-shadow(0 0.06em 0.12em rgba(18, 32, 47, 0.28))",
    ...(options?.interactive ? { touchAction: "none" as const } : { pointerEvents: "none" as const }),
  };
};
