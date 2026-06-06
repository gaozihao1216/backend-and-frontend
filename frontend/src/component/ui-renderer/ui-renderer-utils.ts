import type {
  ButtonBaseDesign,
  ButtonImageDesign,
  ComponentPosition,
  ComponentStyle,
  PanelComponent,
  PageComponent,
  UiPreviewUser,
} from "../../objects/ui-customization/ui-customization-objects.js";
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

export const getPositionStyle = (position: ComponentPosition): React.CSSProperties => {
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
): React.CSSProperties => {
  if (typeof style?.textScalePercent === "number") {
    if (position.unit === "px") {
      return {
        fontSize: `${Math.max(8, (position.height * style.textScalePercent) / 100)}px`,
      };
    }

    return {
      fontSize: `clamp(8px, ${(position.height * style.textScalePercent) / 100}cqh, 42px)`,
    };
  }

  return typeof style?.fontSize === "number" ? { fontSize: `${style.fontSize}px` } : {};
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

export const interpolatePreviewText = (value: string, previewUser?: UiPreviewUser): string => {
  if (!previewUser) {
    return value;
  }

  return value
    .replaceAll("{{nickname}}", previewUser.nickname)
    .replaceAll("{{roleLabel}}", previewUser.roleLabel)
    .replaceAll("{{apiUserId}}", previewUser.apiUserId);
};
