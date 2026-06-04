import type { ButtonComponent } from "../../objects/ui-customization/ui-customization-objects.js";
import type { DynamicRendererContext } from "./ui-renderer-types.js";
import { getComponentStyle, getPositionStyle, interpolatePreviewText } from "./ui-renderer-utils.js";

type DynamicButtonProps = {
  button: ButtonComponent;
  context: DynamicRendererContext;
};

export const DynamicButton = ({ button, context }: DynamicButtonProps) => {
  const label = interpolatePreviewText(button.label, context.previewUser);
  const isActivePanelTrigger = button.action.type === "openPanel" && context.openPanelIds.has(button.action.panelId);

  const handleClick = () => {
    switch (button.action.type) {
      case "navigate":
        context.onNavigate(button.action.targetPath);
        return;
      case "openPanel":
        context.onOpenPanel(button.action.panelId);
        return;
      case "openModal":
      case "none":
        return;
    }
  };

  return (
    <button
      type="button"
      className={`dynamic-ui-button ${button.style?.variant ?? "primary"} ${isActivePanelTrigger ? "active-panel-trigger" : ""}`}
      style={{
        ...getPositionStyle(button.position),
        ...getComponentStyle(button.style),
      }}
      onClick={handleClick}
      disabled={button.action.type === "openModal"}
      title={button.action.type === "openModal" ? "openModal 暂未实现" : undefined}
    >
      {button.icon ? <span className="dynamic-ui-button-icon">{button.icon}</span> : null}
      <span>{label}</span>
    </button>
  );
};
