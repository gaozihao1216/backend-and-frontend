import type { ButtonComponent, ButtonStateOption } from "../../objects/ui-customization/ui-customization-objects.js";
import type { DynamicRendererContext } from "./ui-renderer-types.js";
import {
  getButtonBaseDesignStyle,
  getButtonImageDesignStyle,
  getButtonTextScaleStyle,
  getComponentStyle,
  getPositionStyle,
  interpolatePreviewText,
} from "./ui-renderer-utils.js";

type DynamicButtonProps = {
  button: ButtonComponent;
  context: DynamicRendererContext;
};

export const DynamicButton = ({ button, context }: DynamicButtonProps) => {
  const defaultState = button.stateDesign?.states.find((state: ButtonStateOption) => state.id === button.stateDesign?.defaultStateId)
    ?? button.stateDesign?.states[0]
    ?? null;
  const label = interpolatePreviewText(defaultState?.label ?? button.label, context.previewUser);
  const icon = defaultState?.icon ?? defaultState?.patternTemplateId ?? button.icon;
  const stateStyle = defaultState?.style;
  const isActivePanelTrigger = button.action.type === "openPanel" && context.openPanelIds.has(button.action.panelId);
  const shouldShowContent = !button.imageDesign?.outputDataUrl;

  const handleClick = () => {
    switch (button.action.type) {
      case "navigate":
        context.onNavigate(button.action.targetPath);
        return;
      case "openPanel":
        context.onOpenPanel(button.action.panelId);
        return;
      case "closePanel":
        context.onClosePanel(button.action.panelId ?? "");
        return;
      case "openModal":
      case "none":
      case "apiAction":
        return;
    }
  };

  return (
    <button
      type="button"
      className={`dynamic-ui-button ${stateStyle?.variant ?? button.style?.variant ?? "primary"} base-${defaultState?.baseTemplateId ?? "rounded"} pattern-${defaultState?.patternTemplateId ?? "none"} effect-${button.effect?.templateId ?? "none"} ${isActivePanelTrigger ? "active-panel-trigger" : ""}`}
      style={{
        ...getPositionStyle(button.position),
        ...getComponentStyle(button.style),
        ...getComponentStyle(stateStyle),
        ...getButtonTextScaleStyle(button.position, button.style),
        ...(button.baseDesign ? { backgroundColor: "#ffffff", borderColor: "transparent", borderRadius: 0, padding: 0 } : {}),
      }}
      onClick={handleClick}
      disabled={button.action.type === "openModal"}
      title={button.action.type === "openModal" ? "openModal 暂未实现" : undefined}
    >
      {button.baseDesign ? (
        <span
          className="dynamic-ui-button-base"
          style={getButtonBaseDesignStyle(button.baseDesign)}
          aria-hidden="true"
        >
          {button.baseDesign.scalingMode === "fixedAspect" ? <img src={button.baseDesign.sourceDataUrl} alt="" /> : null}
        </span>
      ) : null}
      {button.imageDesign ? (
        <span
          className="dynamic-ui-button-image"
          style={getButtonImageDesignStyle(button.imageDesign)}
          aria-hidden="true"
        />
      ) : null}
      {shouldShowContent ? (
        <span className="dynamic-ui-button-content">
          {icon ? <span className="dynamic-ui-button-icon">{icon}</span> : null}
          <span>{label}</span>
        </span>
      ) : null}
    </button>
  );
};
