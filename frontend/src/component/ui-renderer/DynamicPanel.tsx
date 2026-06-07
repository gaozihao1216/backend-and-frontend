import { useRef } from "react";
import { useVisualAsset } from "../../hook/useVisualAsset.js";
import { DynamicComponentRenderer } from "./DynamicComponentRenderer.js";
import type { DynamicPanelProps } from "./ui-renderer-types.js";
import { getComponentStyle, getPositionStyle, getStretchVisualDesignStyle } from "./ui-renderer-utils.js";
import type { PageComponent } from "../../objects/ui-customization/ui-customization-objects.js";

const isRenderableChild = (component: PageComponent | undefined): component is PageComponent =>
  Boolean(component);

export const DynamicPanel = ({ panel, context, visitedComponentIds, floating = false }: DynamicPanelProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });
  const nextVisitedComponentIds = new Set(visitedComponentIds);
  nextVisitedComponentIds.add(panel.id);
  const contentSize = panel.contentSize;
  const childComponents = panel.childComponentIds
    .map((childId) => context.componentMap.get(childId))
    .filter(isRenderableChild)
    .filter((component) => !context.controlledPanelIds.has(component.id) || context.openPanelIds.has(component.id))
    .filter((component) => !nextVisitedComponentIds.has(component.id));
  const canDragScroll = Boolean(contentSize);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canDragScroll || event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("button, input, textarea, select, a")) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: container.scrollLeft,
      startScrollTop: container.scrollTop,
    };
    container.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container || !dragStateRef.current.active) {
      return;
    }

    container.scrollLeft = dragStateRef.current.startScrollLeft - (event.clientX - dragStateRef.current.startX);
    container.scrollTop = dragStateRef.current.startScrollTop - (event.clientY - dragStateRef.current.startY);
  };

  const stopDragScroll = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    dragStateRef.current.active = false;
    if (container?.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
  };

  const backgroundDesign = panel.decoration?.backgroundDesign;
  const resolvedBackgroundSource = useVisualAsset(
    backgroundDesign?.templateId,
    backgroundDesign?.sourceDataUrl,
  );
  const backgroundStyle = backgroundDesign
    ? getStretchVisualDesignStyle({
        ...backgroundDesign,
        sourceDataUrl: resolvedBackgroundSource,
      })
    : null;

  return (
    <section
      className={`dynamic-ui-panel no-header kind-${panel.kind ?? "container"} decoration-${panel.decoration?.templateId ?? "plain"} effect-${panel.effect?.templateId ?? "none"} ${floating ? "floating" : ""}`}
      style={{
        ...getPositionStyle(panel.position),
        ...getComponentStyle(panel.style),
        ...(panel.decoration?.accentColor
          ? { ["--level-stage-accent" as string]: panel.decoration.accentColor }
          : {}),
      }}
    >
      {backgroundStyle ? (
        <span
          className="dynamic-ui-panel-background"
          style={backgroundStyle}
          aria-hidden="true"
        />
      ) : null}
      <div
        ref={scrollContainerRef}
        className={`dynamic-ui-panel-content ${contentSize ? "scrollable draggable" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragScroll}
        onPointerCancel={stopDragScroll}
        onPointerLeave={stopDragScroll}
      >
        <div
          className="dynamic-ui-panel-content-canvas"
          style={
            contentSize
              ? {
                  width: `${contentSize.widthPercent}%`,
                  height: `${contentSize.heightPercent}%`,
                }
              : undefined
          }
        >
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
      </div>
    </section>
  );
};
