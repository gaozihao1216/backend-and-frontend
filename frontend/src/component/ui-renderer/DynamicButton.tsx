import type { ButtonComponent } from "../../objects/ui-customization/ui-customization-objects.js";
import {
  getButtonStateHasPatternLayers,
  normalizeButtonStatePatternLayers,
} from "../../lib/button-pattern-layers.js";
import {
  isButtonActionDisabled,
  resolveActiveButtonState,
} from "../../lib/ui-runtime/resolve-button-state.js";
import { ButtonPatternLayers } from "./ButtonPatternLayers.js";
import type { DynamicRendererContext } from "./ui-renderer-types.js";
import {
  getLevelSuffixFromNodeButton,
  LEVEL_NODE_BUTTON_MAX_FONT_SIZE,
} from "../../lib/level-node-button-format.js";
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
  const uiData = context.uiRuntime?.uiData ?? {};
  const activeState = resolveActiveButtonState(button, uiData);
  const label = interpolatePreviewText(activeState?.label ?? button.label, context.previewUser);
  const icon = activeState?.icon ?? activeState?.patternTemplateId ?? button.icon;
  const stateStyle = activeState?.style;
  const activeBaseDesign = activeState?.baseDesign ?? button.baseDesign;
  const activePatternLayers = activeState ? normalizeButtonStatePatternLayers(activeState) : [];
  const isPatternContent = activeState?.contentType === "pattern"
    || (activeState?.contentType == null && activePatternLayers.length > 0);
  const isActivePanelTrigger = button.action.type === "openPanel" && context.openPanelIds.has(button.action.panelId);
  const shouldShowContent = !button.imageDesign?.outputDataUrl
    && !(isPatternContent && activeState && getButtonStateHasPatternLayers(activeState));
  const actionDisabled = isButtonActionDisabled(button, activeState)
    || button.action.type === "openModal"
    || (button.action.type === "apiAction" && !context.uiRuntime);
  const isLevelNodeButton = getLevelSuffixFromNodeButton(button) != null;
  const mergedButtonStyle = { ...button.style, ...stateStyle };

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
      case "apiAction":
        void context.uiRuntime?.invokeUiAction(
          button.action.apiKey,
          button.action.params,
        );
        return;
      case "openModal":
      case "none":
        return;
    }
  };

  return (
    <button
      type="button"
      className={`dynamic-ui-button ${stateStyle?.variant ?? button.style?.variant ?? "primary"} base-${activeState?.baseTemplateId ?? "rounded"} pattern-${activeState?.patternTemplateId ?? "none"} effect-${button.effect?.templateId ?? "none"} ${isActivePanelTrigger ? "active-panel-trigger" : ""}`}
      style={{
        ...getPositionStyle(button.position),
        ...getComponentStyle(button.style),
        ...getComponentStyle(stateStyle),
        ...getButtonTextScaleStyle(
          button.position,
          mergedButtonStyle,
          isLevelNodeButton ? { maxFontSize: LEVEL_NODE_BUTTON_MAX_FONT_SIZE } : undefined,
        ),
        ...(activeBaseDesign ? { backgroundColor: "#ffffff", borderColor: "transparent", borderRadius: 0, padding: 0 } : {}),
      }}
      onClick={handleClick}
      disabled={actionDisabled}
      title={button.action.type === "openModal" ? "openModal 暂未实现" : undefined}
    >
      {activeBaseDesign ? (
        <span
          className="dynamic-ui-button-base"
          style={getButtonBaseDesignStyle(activeBaseDesign)}
          aria-hidden="true"
        >
          {activeBaseDesign.scalingMode === "fixedAspect" ? <img src={activeBaseDesign.sourceDataUrl} alt="" /> : null}
        </span>
      ) : null}
      {button.imageDesign ? (
        <span
          className="dynamic-ui-button-image"
          style={getButtonImageDesignStyle(button.imageDesign)}
          aria-hidden="true"
        />
      ) : null}
      {isPatternContent && activePatternLayers.length > 0 && activeState ? (
        <ButtonPatternLayers state={activeState} label={label} />
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
