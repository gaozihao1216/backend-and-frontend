import { useEffect, useMemo, useState } from "react";
import { useUiPageRuntime } from "../../hook/useUiPageRuntime.js";
import { collectPanelOpenRefreshKeys } from "../../lib/ui-runtime/ui-data-keys.js";
import { DynamicComponentRenderer } from "./DynamicComponentRenderer.js";
import type { DynamicPageRendererProps } from "./ui-renderer-types.js";
import { createComponentMap, getControlledPanelIds, getRootComponents } from "./ui-renderer-utils.js";

export const DynamicPageRenderer = ({
  page,
  previewUser,
  runtimeUserId,
  previewUiData,
  onNavigate,
  levelMapLayoutEdit,
  levelMapPathEdit,
}: DynamicPageRendererProps) => {
  const [openPanelIds, setOpenPanelIds] = useState<Set<string>>(() => new Set());
  const componentMap = useMemo(() => createComponentMap(page.components), [page.components]);
  const controlledPanelIds = useMemo(() => getControlledPanelIds(page.components), [page.components]);
  const rootComponents = useMemo(() => getRootComponents(page.components), [page.components]);
  const { uiData: runtimeUiData, refreshUiData, invokeUiAction } = useUiPageRuntime(page, runtimeUserId);
  const uiData = useMemo(
    () => ({ ...runtimeUiData, ...previewUiData }),
    [previewUiData, runtimeUiData],
  );

  useEffect(() => {
    const refreshKeys = collectPanelOpenRefreshKeys(page, openPanelIds);
    if (refreshKeys.length === 0) {
      return;
    }

    void refreshUiData(refreshKeys);
  }, [openPanelIds, page, refreshUiData]);

  const context = {
    componentMap,
    openPanelIds,
    controlledPanelIds,
    previewUser,
    runtimeUserId,
    uiRuntime: {
      uiData,
      refreshUiData,
      invokeUiAction,
    },
    ...(levelMapLayoutEdit ? { levelMapLayoutEdit } : {}),
    ...(levelMapPathEdit ? { levelMapPathEdit } : {}),
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
