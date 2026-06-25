import type { PointerEvent } from "react";
import type { ButtonComponent } from "../../objects/ui-customization/ui-customization-objects.js";
import {
  COMPONENT_RESIZE_HANDLES,
} from "../../lib/component-position-adjust.js";
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
  getButtonImageDesignStyle,
  getButtonTextScaleStyle,
  getComponentStyle,
  getPositionStyle,
  getTemplateButtonShellStyle,
  interpolatePreviewText,
} from "./ui-renderer-utils.js";
import { ProcessedTemplateBase } from "./ProcessedTemplateImage.js";

type DynamicButtonProps = {
  button: ButtonComponent;
  context: DynamicRendererContext;
};

export const DynamicButton = ({ button, context }: DynamicButtonProps) => {
  const uiData = context.uiRuntime?.uiData ?? {};
  const activeState = resolveActiveButtonState(button, uiData);
  const label = interpolatePreviewText(
    activeState?.label ?? button.label,
    context.previewUser,
    context.uiRuntime?.uiData,
  );
  const icon = activeState?.icon ?? activeState?.patternTemplateId ?? button.icon;
  const stateStyle = activeState?.style;
  const activeBaseDesign = activeState?.baseDesign ?? button.baseDesign;
  const resolvedBaseDesign = activeBaseDesign?.sourceDataUrl ? activeBaseDesign : undefined;
  const activePatternLayers = activeState ? normalizeButtonStatePatternLayers(activeState) : [];
  const isPatternContent = activeState?.contentType === "pattern"
    || (activeState?.contentType == null && activePatternLayers.length > 0);
  const isActivePanelTrigger = button.action.type === "openPanel" && context.openPanelIds.has(button.action.panelId);
  const shouldShowContent = !button.imageDesign?.outputDataUrl
    && !(isPatternContent && activeState && getButtonStateHasPatternLayers(activeState));
  const levelSuffix = getLevelSuffixFromNodeButton(button);
  const layoutEdit = context.levelMapLayoutEdit;
  const pathEdit = context.levelMapPathEdit;
  const inLayoutEdit = Boolean(layoutEdit?.enabled && levelSuffix);
  const inPathConnect = Boolean(pathEdit?.enabled && levelSuffix && pathEdit.connectFromSuffix !== null);
  const isLayoutSelected = inLayoutEdit && layoutEdit?.selectedLevelSuffix === levelSuffix;
  const isPathConnectSource = inPathConnect && pathEdit?.connectFromSuffix === levelSuffix;
  const actionDisabled = inLayoutEdit || inPathConnect
    ? false
    : isButtonActionDisabled(button, activeState)
      || button.action.type === "openModal"
      || (button.action.type === "apiAction" && !context.uiRuntime);
  const isLevelNodeButton = levelSuffix != null;
  const mergedButtonStyle = { ...button.style, ...stateStyle };

  const handleClick = () => {
    if (inPathConnect && levelSuffix) {
      pathEdit?.onConnectNode(levelSuffix);
      return;
    }

    if (inLayoutEdit && levelSuffix) {
      layoutEdit?.onSelect(levelSuffix);
      return;
    }

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
      case "openSettings":
        context.onOpenSettings?.();
        return;
      case "logout":
        context.onLogout?.();
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

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!inLayoutEdit || !levelSuffix || inPathConnect || event.button !== 0) {
      return;
    }

    if ((event.target as HTMLElement).closest("[data-level-map-resize-handle]")) {
      return;
    }

    const wasSelected = layoutEdit?.selectedLevelSuffix === levelSuffix;
    layoutEdit?.onSelect(levelSuffix);

    if (wasSelected) {
      layoutEdit?.onBeginMove(levelSuffix, event);
    }
  };

  return (
    <button
      type="button"
      className={`dynamic-ui-button ${stateStyle?.variant ?? button.style?.variant ?? "primary"} base-${activeState?.baseTemplateId ?? "rounded"} pattern-${activeState?.patternTemplateId ?? "none"} effect-${button.effect?.templateId ?? "none"} ${isActivePanelTrigger ? "active-panel-trigger" : ""}${resolvedBaseDesign ? " uses-template-base" : ""}${isLayoutSelected ? " level-map-layout-selected" : ""}${inLayoutEdit ? " level-map-layout-editable" : ""}${isPathConnectSource ? " level-map-path-connect-source" : ""}${inPathConnect && pathEdit?.connectFromSuffix ? " level-map-path-connect-target" : ""}`}
      style={{
        ...getPositionStyle(button.position, context.layoutType),
        ...getComponentStyle(button.style),
        ...getComponentStyle(stateStyle),
        ...getButtonTextScaleStyle(
          button.position,
          mergedButtonStyle,
          isLevelNodeButton ? { maxFontSize: LEVEL_NODE_BUTTON_MAX_FONT_SIZE } : undefined,
        ),
        ...(resolvedBaseDesign ? getTemplateButtonShellStyle() : {}),
      }}
      onClick={handleClick}
      onPointerDown={inLayoutEdit ? handlePointerDown : undefined}
      disabled={actionDisabled}
      title={button.action.type === "openModal" ? "openModal 暂未实现" : undefined}
    >
      {resolvedBaseDesign ? (
        <ProcessedTemplateBase baseDesign={resolvedBaseDesign} />
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
      {isLayoutSelected && layoutEdit && levelSuffix ? (
        <>
          {COMPONENT_RESIZE_HANDLES.map((handle) => (
            <span
              key={handle}
              className={`level-map-layout-handle page-builder-corner ${handle}`}
              data-level-map-resize-handle={handle}
              onPointerDown={(event) => {
                event.stopPropagation();
                event.preventDefault();
                layoutEdit.onBeginResize(levelSuffix, handle, event);
              }}
            />
          ))}
        </>
      ) : null}
    </button>
  );
};
