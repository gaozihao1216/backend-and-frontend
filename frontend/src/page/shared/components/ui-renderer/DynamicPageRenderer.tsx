import { useEffect, useMemo, useState } from "react";
import { useUiPageRuntime } from "../../hooks/ui-runtime/useUiPageRuntime.js";
import { collectPanelOpenRefreshKeys } from "../../function/ui-runtime/ui-data-keys.js";
import { DynamicComponentRenderer } from "./DynamicComponentRenderer.js";
import type { DynamicPageRendererProps } from "./ui-renderer-types.js";
import { createComponentMap, getControlledPanelIds, getRootComponents } from "./ui-renderer-utils.js";

/**
 * PageConfig 组件树渲染入口。
 *
 * 这里会先把扁平 components 建成索引，再找出根节点递归渲染；
 * 同时维护面板展开状态和 UI runtime 数据，供按钮、面板、组件联动使用。
 */
export const DynamicPageRenderer = ({
  page,
  previewUser,
  runtimeUserId,
  previewUiData,
  onNavigate,
  fitStageToHost,
  onOpenSettings,
  onLogout,
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
    // 某些数据只有面板展开后才需要刷新，避免页面初次渲染就请求所有 runtime 数据。
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
    layoutType: page.layout.type,
    roleHomeSurface: /\.home$/.test(page.id),
    ...(fitStageToHost ? { fitStageToHost: true } : {}),
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
    ...(onOpenSettings ? { onOpenSettings } : {}),
    ...(onLogout ? { onLogout } : {}),
  };

  return (
    <div
      className={`dynamic-ui-page layout-${page.layout.type}${/\.home$/.test(page.id) ? " role-home-surface" : ""}`.trim()}
      data-page-id={page.id}
      style={
        page.layout.type === "stack" && typeof page.layout.gap === "number"
          ? { ["--dynamic-ui-stack-gap" as string]: `${page.layout.gap}px` }
          : undefined
      }
    >
      {rootComponents.map((component) => (
        <DynamicComponentRenderer key={component.id} component={component} context={context} />
      ))}
    </div>
  );
};
