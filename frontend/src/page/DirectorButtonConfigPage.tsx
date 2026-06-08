import { useMemo, useState } from "react";
import { getPageConfig, savePageConfig } from "../lib/ui-customization.js";
import {
  endpointOptions,
  isDynamicPath,
  routeTrees,
  type RouteNode,
  type SelectedRoute,
} from "../objects/ui-customization/ui-route-tree.js";
import type { ButtonComponent, ComponentAction, PageComponent, PageConfig, PanelComponent, UiEndpoint } from "../objects/ui-customization/ui-customization-objects.js";

type DirectorButtonConfigPageProps = {
  pageId: string | null;
  componentId: string | null;
  onBack: () => void;
};

const findButton = (pageConfig: PageConfig | null, componentId: string | null): ButtonComponent | null => {
  const component = componentId ? pageConfig?.components.find((candidate) => candidate.id === componentId) : null;
  return component?.type === "button" ? component : null;
};

const getActionMode = (action: ComponentAction): "navigate" | "openPanel" =>
  action.type === "openPanel" ? "openPanel" : "navigate";

const getPanelDisplayName = (panel: PanelComponent) =>
  panel.title?.trim() || panel.id;

const getComponentDisplayName = (component: PageComponent) => {
  if (component.type === "button") {
    return component.label || component.id;
  }
  if (component.type === "text") {
    return component.text || component.id;
  }
  if (component.type === "panel") {
    return getPanelDisplayName(component);
  }
  if (component.type === "list") {
    return component.emptyStateText || component.dataPath || component.id;
  }
  if (component.type === "widget") {
    return component.widgetId === "adminProposalReview"
      ? "提案审核"
      : component.widgetId === "levelMapStage"
        ? "关卡路径地图"
        : component.widgetId;
  }

  return "";
};

const getComponentTypeLabel = (component: PageComponent) => {
  if (component.type === "button") {
    return "按钮";
  }
  if (component.type === "text") {
    return "文本";
  }
  if (component.type === "list") {
    return "列表";
  }
  if (component.type === "widget") {
    return "功能组件";
  }
  return "面板";
};

const renderRouteTree = (
  node: RouteNode,
  selectedRoute: SelectedRoute,
  onSelectRoute: (route: SelectedRoute) => void,
) => (
  <li key={`${node.label}-${node.path}`}>
    <button
      type="button"
      className={`ui-route-node ${node.pageId === selectedRoute.pageId ? "selected" : ""}`}
      onClick={() => onSelectRoute({ pageId: node.pageId, label: node.label, path: node.path })}
    >
      <strong>{node.label}</strong>
      <span>
        <code>{node.path}</code>
        <small>{node.pageId}</small>
      </span>
    </button>
    {node.children ? (
      <ul>{node.children.map((child) => renderRouteTree(child, selectedRoute, onSelectRoute))}</ul>
    ) : null}
  </li>
);

export const DirectorButtonConfigPage = ({ pageId, componentId, onBack }: DirectorButtonConfigPageProps) => {
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(() => pageId ? getPageConfig(pageId) : null);
  const selectedButton = useMemo(() => findButton(pageConfig, componentId), [componentId, pageConfig]);
  const [actionMode, setActionMode] = useState<"navigate" | "openPanel">(() =>
    selectedButton ? getActionMode(selectedButton.action) : "navigate",
  );
  const [targetPath, setTargetPath] = useState(() =>
    selectedButton?.action.type === "navigate" ? selectedButton.action.targetPath : "",
  );
  const [targetPageId, setTargetPageId] = useState(() =>
    selectedButton?.action.type === "navigate" ? selectedButton.action.targetPageId : "",
  );
  const [panelId, setPanelId] = useState(() =>
    selectedButton?.action.type === "openPanel" ? selectedButton.action.panelId : "",
  );
  const [routePickerOpen, setRoutePickerOpen] = useState(false);
  const [routePickerEndpoint, setRoutePickerEndpoint] = useState<UiEndpoint>(() => pageConfig?.roleScope ?? "player");
  const [selectedRoute, setSelectedRoute] = useState<SelectedRoute>(() => routeTrees[pageConfig?.roleScope ?? "player"]);
  const [feedback, setFeedback] = useState("");

  const availablePanels = useMemo(
    () => pageConfig?.components.filter((component): component is PanelComponent => component.type === "panel") ?? [],
    [pageConfig],
  );
  const selectedPanel = useMemo(
    () => availablePanels.find((panel) => panel.id === panelId) ?? null,
    [availablePanels, panelId],
  );
  const componentMap = useMemo(
    () => new Map((pageConfig?.components ?? []).map((component) => [component.id, component])),
    [pageConfig],
  );
  const selectedPanelChildren = selectedPanel
    ? selectedPanel.childComponentIds.map((childId) => componentMap.get(childId)).filter((component): component is PageComponent => Boolean(component))
    : [];
  const routePickerTree = routeTrees[routePickerEndpoint];

  const handleSelectRoute = (route: SelectedRoute) => {
    setSelectedRoute(route);
    if (!isDynamicPath(route.path)) {
      setTargetPageId(route.pageId);
      setTargetPath(route.path);
      setRoutePickerOpen(false);
      setFeedback("");
    }
  };

  const handleRouteEndpointChange = (endpoint: UiEndpoint) => {
    setRoutePickerEndpoint(endpoint);
    setSelectedRoute(routeTrees[endpoint]);
  };

  const handleSave = () => {
    if (!pageConfig || !selectedButton) {
      return;
    }

    const nextAction: ComponentAction =
      actionMode === "navigate"
        ? {
            type: "navigate",
            targetPageId: targetPageId.trim() || pageConfig.id,
            targetPath: targetPath.trim() || pageConfig.path,
          }
        : {
            type: "openPanel",
            panelId: panelId.trim(),
          };

    if (nextAction.type === "openPanel" && !nextAction.panelId) {
      setFeedback("请选择要导出的小面板。");
      return;
    }

    const nextPageConfig: PageConfig = {
      ...pageConfig,
      components: pageConfig.components.map((component) =>
        component.id === selectedButton.id && component.type === "button"
          ? {
              ...component,
              action: nextAction,
            }
          : component,
      ),
    };

    const savedConfig = savePageConfig(nextPageConfig);
    setPageConfig(savedConfig);
    setFeedback("按钮配置已保存。");
  };

  return (
    <section className="button-config-shell">
      <div className="page-builder-toolbar">
        <div>
          <p className="eyebrow">Button Config</p>
          <h2>按钮配置</h2>
          <p className="panel-copy">配置按钮点击后的功能：跳转界面，或导出一个独立小面板。</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={onBack}>
            返回页面优化
          </button>
          <button type="button" disabled={!selectedButton} onClick={handleSave}>
            保存按钮配置
          </button>
        </div>
      </div>

      {!pageId ? <p className="feedback error">缺少 pageId，无法进入按钮配置。</p> : null}
      {pageId && !pageConfig ? <p className="feedback error">该页面配置不存在。</p> : null}
      {pageConfig && !selectedButton ? <p className="feedback error">当前组件不是按钮，无法配置。</p> : null}
      {feedback ? <p className="feedback">{feedback}</p> : null}

      {selectedButton ? (
        <div className="button-config-layout">
          <section className="button-config-panel">
            <h3>功能类型</h3>
            <label className="button-design-field">
              <span>点击动作</span>
              <select
                value={actionMode}
                onChange={(event) => {
                  setActionMode(event.target.value as "navigate" | "openPanel");
                  setFeedback("");
                }}
              >
                <option value="navigate">转移界面</option>
                <option value="openPanel">导出小面板</option>
              </select>
            </label>
          </section>

          {actionMode === "navigate" ? (
            <section className="button-config-panel">
              <h3>跳转目标</h3>
              <button type="button" className="secondary" onClick={() => setRoutePickerOpen((current) => !current)}>
                查找目标
              </button>
              <label className="button-design-field">
                <span>目标页面 ID</span>
                <input value={targetPageId} onChange={(event) => setTargetPageId(event.target.value)} />
              </label>
              <label className="button-design-field">
                <span>目标路径</span>
                <input value={targetPath} onChange={(event) => setTargetPath(event.target.value)} />
              </label>
              {routePickerOpen ? (
                <section className="button-config-route-picker">
                  <div className="director-ui-endpoint-grid">
                    {endpointOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`role-card director-ui-endpoint ${option.id === routePickerEndpoint ? "active" : ""}`}
                        onClick={() => handleRouteEndpointChange(option.id)}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                      </button>
                    ))}
                  </div>
                  <ul className="ui-route-tree">{renderRouteTree(routePickerTree, selectedRoute, handleSelectRoute)}</ul>
                  {isDynamicPath(selectedRoute.path) ? (
                    <p className="feedback error">动态模板路径需要具体实例后才能作为跳转目标。</p>
                  ) : null}
                </section>
              ) : null}
            </section>
          ) : (
            <section className="button-config-panel">
              <h3>小面板目标</h3>
              <div className="button-config-panel-picker">
                {availablePanels.length > 0 ? (
                  availablePanels.map((panel) => (
                    <button
                      key={panel.id}
                      type="button"
                      className={`button-config-panel-option ${panel.id === panelId ? "selected" : ""}`}
                      onClick={() => {
                        setPanelId(panel.id);
                        setFeedback("");
                      }}
                    >
                      <strong>{getPanelDisplayName(panel)}</strong>
                      <span>{panel.id}</span>
                      <small>{panel.childComponentIds.length} 个子组件</small>
                    </button>
                  ))
                ) : (
                  <p className="meta">当前页面还没有可导出的小面板。</p>
                )}
              </div>
              {selectedPanel ? (
                <section className="button-config-panel-preview">
                  <div>
                    <strong>{getPanelDisplayName(selectedPanel)}</strong>
                    <code>{selectedPanel.id}</code>
                  </div>
                  <div className="button-config-panel-preview-meta">
                    <span>{selectedPanel.kind ?? "panel"}</span>
                    <span>
                      {selectedPanel.position.width.toFixed(1)} x {selectedPanel.position.height.toFixed(1)}
                      {selectedPanel.position.unit === "px" ? "px" : "%"}
                    </span>
                  </div>
                  {selectedPanelChildren.length > 0 ? (
                    <ul>
                      {selectedPanelChildren.map((child) => (
                        <li key={child.id}>
                          <span>{getComponentTypeLabel(child)}</span>
                          <strong>{getComponentDisplayName(child)}</strong>
                          <code>{child.id}</code>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="meta">该面板还没有子组件。</p>
                  )}
                </section>
              ) : null}
              <p className="meta">小面板会作为独立浮动层显示，多个按钮可以指向同一个面板。</p>
            </section>
          )}
        </div>
      ) : null}
    </section>
  );
};
