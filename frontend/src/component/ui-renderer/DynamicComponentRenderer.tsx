import { DynamicButton } from "./DynamicButton.js";
import { DynamicPanel } from "./DynamicPanel.js";
import { DynamicText } from "./DynamicText.js";
import type { DynamicComponentRendererProps } from "./ui-renderer-types.js";

export const DynamicComponentRenderer = ({
  component,
  context,
  visitedComponentIds = new Set<string>(),
  floating = false,
}: DynamicComponentRendererProps) => {
  if (visitedComponentIds.has(component.id)) {
    return null;
  }

  switch (component.type) {
    case "button":
      return <DynamicButton button={component} context={context} />;
    case "panel":
      return (
        <DynamicPanel
          panel={component}
          context={context}
          visitedComponentIds={visitedComponentIds}
          floating={floating}
        />
      );
    case "text":
      return <DynamicText text={component} context={context} />;
  }
};
