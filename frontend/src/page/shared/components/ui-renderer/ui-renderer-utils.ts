import type {
  ButtonBaseDesign,
  ButtonImageDesign,
  ButtonImageFrame,
  ComponentPosition,
  ComponentStyle,
  PageLayoutType,
  PanelComponent,
  PageComponent,
  StretchVisualDesign,
  UiPreviewUser,
} from "../../../../objects/ui-customization/ui-customization-objects.js";
import { buildUiTextRuntimeContext } from "../../function/ui-config/ui-text-runtime-context.js";
import type { ComponentMap } from "./ui-renderer-types.js";

export const createComponentMap = (components: PageComponent[]): ComponentMap =>
  new Map(components.map((component) => [component.id, component]));

export const isControlledPanel = (component: PageComponent): component is PanelComponent =>
  component.type === "panel"
  && (
    component.kind === "overlay"
    || component.panelRole === "popover"
    || component.panelRole === "workflowPanel"
  );

export const getControlledPanelIds = (components: PageComponent[]): Set<string> => {
  const controlledPanelIds = new Set<string>();

  components.forEach((component) => {
    if (isControlledPanel(component)) {
      controlledPanelIds.add(component.id);
    }
    if (component.type === "button" && component.action.type === "openPanel") {
      controlledPanelIds.add(component.action.panelId);
    }
  });

  return controlledPanelIds;
};

export const getRootComponents = (components: PageComponent[]): PageComponent[] => {
  const childIds = new Set<string>();
  const controlledPanelIds = getControlledPanelIds(components);

  components.forEach((component) => {
    if (component.type === "panel") {
      component.childComponentIds.forEach((childId) => childIds.add(childId));
    }
  });

  return components.filter((component) => !childIds.has(component.id) && !controlledPanelIds.has(component.id));
};

export const getPositionStyle = (
  position: ComponentPosition,
  layoutType: PageLayoutType = "freeform",
): React.CSSProperties => {
  if (layoutType === "stack") {
    return {
      position: "relative",
      width: "100%",
      height: "auto",
    };
  }

  const unit = position.unit === "px" ? "px" : "%";

  return {
    position: "absolute",
    left: `${position.x}${unit}`,
    top: `${position.y}${unit}`,
    width: `${position.width}${unit}`,
    height: `${position.height}${unit}`,
  };
};

export const getComponentStyle = (style?: ComponentStyle): React.CSSProperties => ({
  ...(style?.backgroundColor ? { backgroundColor: style.backgroundColor } : {}),
  ...(style?.textColor ? { color: style.textColor } : {}),
  ...(typeof style?.borderRadius === "number" ? { borderRadius: `${style.borderRadius}px` } : {}),
  ...(typeof style?.fontSize === "number" ? { fontSize: `${style.fontSize}px` } : {}),
});

export const getButtonTextScaleStyle = (
  position: ComponentPosition,
  style?: ComponentStyle,
  options?: { maxFontSize?: number },
): React.CSSProperties => {
  const maxFontSize = options?.maxFontSize ?? 42;

  if (typeof style?.textScalePercent === "number") {
    if (position.unit === "px") {
      return {
        fontSize: `${Math.min(maxFontSize, Math.max(8, (position.height * style.textScalePercent) / 100))}px`,
      };
    }

    return {
      fontSize: `clamp(8px, ${(position.height * style.textScalePercent) / 100}cqh, ${maxFontSize}px)`,
    };
  }

  if (typeof style?.fontSize === "number") {
    return { fontSize: `${Math.min(maxFontSize, style.fontSize)}px` };
  }

  return {};
};

export const getButtonImageDesignStyle = (imageDesign: ButtonImageDesign): React.CSSProperties => {
  const imageFrame = imageDesign.imageFrame ?? {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  };

  if (imageDesign.outputDataUrl) {
    return {
      backgroundImage: `url("${imageDesign.outputDataUrl}")`,
      backgroundPosition: "center",
      backgroundSize: "contain",
      width: `${imageFrame.width}%`,
      height: `${imageFrame.height}%`,
      left: `${imageFrame.x}%`,
      top: `${imageFrame.y}%`,
    };
  }

  if (!imageDesign.crop) {
    return {
      backgroundImage: `url("${imageDesign.sourceDataUrl}")`,
      backgroundPosition: "center",
      backgroundSize: "contain",
      width: "100%",
      height: "100%",
      left: "0",
      top: "0",
    };
  }

  const crop = imageDesign.crop;
  return {
    backgroundImage: `url("${imageDesign.sourceDataUrl}")`,
    width: `${10000 / crop.width}%`,
    height: `${10000 / crop.height}%`,
    left: `${(-crop.x / crop.width) * 100}%`,
    top: `${(-crop.y / crop.height) * 100}%`,
  };
};

export const getButtonBaseDesignStyle = (baseDesign: ButtonBaseDesign): React.CSSProperties => {
  if (baseDesign.scalingMode === "nineSlice" && baseDesign.slice) {
    const { top, right, bottom, left } = baseDesign.slice;
    return {
      inset: 0,
      borderStyle: "solid",
      borderWidth: `${top}px ${right}px ${bottom}px ${left}px`,
      borderImageSource: `url("${baseDesign.sourceDataUrl}")`,
      borderImageSlice: `${top} ${right} ${bottom} ${left} fill`,
      borderImageRepeat: "stretch",
      boxSizing: "border-box",
    };
  }

  return {
    inset: 0,
  };
};

/** Transparent shell when a button uses a library template base instead of flat colors. */
export const getTemplateButtonShellStyle = (): React.CSSProperties => ({
  backgroundColor: "transparent",
  borderColor: "transparent",
  borderRadius: 0,
  padding: 0,
  boxShadow: "none",
});

export const DEFAULT_STRETCH_VISUAL_FRAME: ButtonImageFrame = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

export const getStretchVisualDesignStyle = (design: StretchVisualDesign): React.CSSProperties => {
  if (!design.sourceDataUrl) {
    return {};
  }

  const baseStyle: React.CSSProperties = {
    backgroundImage: `url("${design.sourceDataUrl}")`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
  };

  if (!design.frame) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    left: `${design.frame.x}%`,
    top: `${design.frame.y}%`,
    width: `${design.frame.width}%`,
    height: `${design.frame.height}%`,
  };
};

export const interpolatePreviewText = (
  value: string,
  previewUser?: UiPreviewUser,
  uiData?: Record<string, unknown>,
): string => {
  const context = buildUiTextRuntimeContext(previewUser, uiData);
  if (!context) {
    return value;
  }

  return value
    .replaceAll("{{nickname}}", context.nickname)
    .replaceAll("{{roleLabel}}", context.roleLabel)
    .replaceAll("{{apiUserId}}", context.apiUserId)
    .replaceAll("{{roleScope}}", context.roleScope)
    .replaceAll("{{coins}}", String(context.coins))
    .replaceAll("{{gems}}", String(context.gems))
    .replaceAll("{{fragments}}", String(context.fragments))
    .replaceAll("{{clearedLevelCount}}", String(context.clearedLevelCount));
};
