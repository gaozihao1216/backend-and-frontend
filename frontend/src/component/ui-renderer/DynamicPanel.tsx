import { DynamicComponentRenderer } from "./DynamicComponentRenderer.js";
import type { DynamicPanelProps } from "./ui-renderer-types.js";
import { getComponentStyle, getPositionStyle } from "./ui-renderer-utils.js";
import type { PageComponent } from "../../objects/ui-customization/ui-customization-objects.js";

const isRenderableChild = (component: PageComponent | undefined): component is PageComponent =>
  Boolean(component);

export const DynamicPanel = ({ panel, context, visitedComponentIds, floating = false }: DynamicPanelProps) => {
  const nextVisitedComponentIds = new Set(visitedComponentIds);
  nextVisitedComponentIds.add(panel.id);
  const childComponents = panel.childComponentIds
    .map((childId) => context.componentMap.get(childId))
    .filter(isRenderableChild)
    .filter((component) => !context.controlledPanelIds.has(component.id) || context.openPanelIds.has(component.id))
    .filter((component) => !nextVisitedComponentIds.has(component.id));

  return (
    <section
      className={`dynamic-ui-panel no-header kind-${panel.kind ?? "container"} ${floating ? "floating" : ""}`}
      style={{
        ...getPositionStyle(panel.position),
        ...getComponentStyle(panel.style),
      }}
    >
      <div className="dynamic-ui-panel-content">
        {childComponents.map((component) => (
          <DynamicComponentRenderer
            key={component.id}
            component={component}
            context={context}
            visitedComponentIds={nextVisitedComponentIds}
            floating={context.controlledPanelIds.has(component.id)}
          />
        ))}
      </div>
    </section>
  );
};
