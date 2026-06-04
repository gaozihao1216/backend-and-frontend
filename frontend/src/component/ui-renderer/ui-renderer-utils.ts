import type {
  ComponentPosition,
  ComponentStyle,
  PageComponent,
  UiPreviewUser,
} from "../../objects/ui-customization/ui-customization-objects.js";
import type { ComponentMap } from "./ui-renderer-types.js";

export const createComponentMap = (components: PageComponent[]): ComponentMap =>
  new Map(components.map((component) => [component.id, component]));

export const getControlledPanelIds = (components: PageComponent[]): Set<string> => {
  const controlledPanelIds = new Set<string>();

  components.forEach((component) => {
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

export const interpolatePreviewText = (value: string, previewUser?: UiPreviewUser): string => {
  if (!previewUser) {
    return value;
  }

  return value
    .replaceAll("{{nickname}}", previewUser.nickname)
    .replaceAll("{{roleLabel}}", previewUser.roleLabel)
    .replaceAll("{{apiUserId}}", previewUser.apiUserId);
};
