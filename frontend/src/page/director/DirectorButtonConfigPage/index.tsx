import {
  endpointOptions,
  isDynamicPath,
  type RouteNode,
  type SelectedRoute,
} from "../../../objects/ui-customization/ui-route-tree.js";
import type { PageComponent, PanelComponent } from "../../../objects/ui-customization/ui-customization-objects.js";
import { DirectorButtonConfigHeader } from "./components/DirectorButtonConfigHeader.js";
import { useDirectorButtonConfigPage } from "./hooks/useDirectorButtonConfigPage.js";
import type { DirectorButtonConfigPageProps } from "./objects/director-button-config-page-types.js";

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
  const vm = useDirectorButtonConfigPage(pageId, componentId);

  return (
    <section className="button-config-shell">
      <DirectorButtonConfigHeader canSave={Boolean(vm.selectedButton)} onBack={onBack} onSave={vm.handleSave} />

      {!pageId ? <p className="feedback error">缺少 pageId，无法进入按钮配置。</p> : null}
      {pageId && !vm.pageConfig ? <p className="feedback error">该页面配置不存在。</p> : null}
      {vm.pageConfig && !vm.selectedButton ? <p className="feedback error">当前组件不是按钮，无法配置。</p> : null}
      {vm.feedback ? <p className="feedback">{vm.feedback}</p> : null}

      {vm.selectedButton ? (
        <div className="button-config-layout">
          <section className="button-config-panel">
            <h3>功能类型</h3>
            <label className="button-design-field">
              <span>点击动作</span>
              <select
                value={vm.actionMode}
                onChange={(event) => vm.handleActionModeChange(event.target.value as "navigate" | "openPanel")}
              >
                <option value="navigate">转移界面</option>
                <option value="openPanel">导出小面板</option>
              </select>
            </label>
          </section>

          {vm.actionMode === "navigate" ? (
            <section className="button-config-panel">
              <h3>跳转目标</h3>
              <button type="button" className="secondary" onClick={() => vm.setRoutePickerOpen((current) => !current)}>
                查找目标
              </button>
              <label className="button-design-field">
                <span>目标页面 ID</span>
                <input value={vm.targetPageId} onChange={(event) => vm.setTargetPageId(event.target.value)} />
              </label>
              <label className="button-design-field">
                <span>目标路径</span>
                <input value={vm.targetPath} onChange={(event) => vm.setTargetPath(event.target.value)} />
              </label>
              {vm.routePickerOpen ? (
                <section className="button-config-route-picker">
                  <div className="director-ui-endpoint-grid">
                    {endpointOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`role-card director-ui-endpoint ${option.id === vm.routePickerEndpoint ? "active" : ""}`}
                        onClick={() => vm.handleRouteEndpointChange(option.id)}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                      </button>
                    ))}
                  </div>
                  <ul className="ui-route-tree">{renderRouteTree(vm.routePickerTree, vm.selectedRoute, vm.handleSelectRoute)}</ul>
                  {isDynamicPath(vm.selectedRoute.path) ? (
                    <p className="feedback error">动态模板路径需要具体实例后才能作为跳转目标。</p>
                  ) : null}
                </section>
              ) : null}
            </section>
          ) : (
            <section className="button-config-panel">
              <h3>小面板目标</h3>
              <div className="button-config-panel-picker">
                {vm.availablePanels.length > 0 ? (
                  vm.availablePanels.map((panel) => (
                    <button
                      key={panel.id}
                      type="button"
                      className={`button-config-panel-option ${panel.id === vm.panelId ? "selected" : ""}`}
                      onClick={() => vm.selectPanel(panel.id)}
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
              {vm.selectedPanel ? (
                <section className="button-config-panel-preview">
                  <div>
                    <strong>{getPanelDisplayName(vm.selectedPanel)}</strong>
                    <code>{vm.selectedPanel.id}</code>
                  </div>
                  <div className="button-config-panel-preview-meta">
                    <span>{vm.selectedPanel.kind ?? "panel"}</span>
                    <span>
                      {vm.selectedPanel.position.width.toFixed(1)} x {vm.selectedPanel.position.height.toFixed(1)}
                      {vm.selectedPanel.position.unit === "px" ? "px" : "%"}
                    </span>
                  </div>
                  {vm.selectedPanelChildren.length > 0 ? (
                    <ul>
                      {vm.selectedPanelChildren.map((child) => (
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
