import { useMemo, useState } from "react";
import { DynamicComponentRenderer } from "./DynamicComponentRenderer.js";
import type { DynamicPageRendererProps } from "./ui-renderer-types.js";
import { createComponentMap, getControlledPanelIds, getRootComponents } from "./ui-renderer-utils.js";

export const DynamicPageRenderer = ({ page, previewUser, onNavigate }: DynamicPageRendererProps) => {
  const [openPanelIds, setOpenPanelIds] = useState<Set<string>>(() => new Set());
  const componentMap = useMemo(() => createComponentMap(page.components), [page.components]);
  const controlledPanelIds = useMemo(() => getControlledPanelIds(page.components), [page.components]);
  const rootComponents = useMemo(() => getRootComponents(page.components), [page.components]);

  const context = {
    componentMap,
    openPanelIds,
    controlledPanelIds,
    previewUser,
    onNavigate,
    onOpenPanel: (panelId: string) =>
      setOpenPanelIds((current) => {
        const next = new Set(current);
        if (next.has(panelId)) {
          next.delete(panelId);
        } else {
          next.add(panelId);
        }
        return next;
      }),
    onClosePanel: (panelId: string) =>
      setOpenPanelIds((current) => {
        const next = new Set(current);
        next.delete(panelId);
        return next;
      }),
  };

  return (
    <div className={`dynamic-ui-page layout-${page.layout.type}`}>
      {rootComponents.map((component) => (
        <DynamicComponentRenderer key={component.id} component={component} context={context} />
      ))}
    </div>
  );
};
