import {
  endpointOptions,
  type RouteNode,
  type SelectedRoute,
} from "../../../objects/ui-customization/ui-route-tree.js";
import type {
  PageLayoutType,
} from "../../../objects/ui-customization/ui-customization-objects.js";
import { DirectorUiCustomizationHeader } from "./components/DirectorUiCustomizationHeader.js";
import { useDirectorUiCustomizationPage } from "./hooks/useDirectorUiCustomizationPage.js";
import type { DirectorUiCustomizationPageProps } from "./objects/director-ui-customization-page-types.js";

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

export const DirectorUiCustomizationPage = ({ onNavigate }: DirectorUiCustomizationPageProps) => {
  const vm = useDirectorUiCustomizationPage(onNavigate);

  return (
    <section className="panel director-ui-page">
      <DirectorUiCustomizationHeader
        manualOpen={vm.manualOpen}
        onOpenTemplates={() => onNavigate("/director_console/ui_customization/button_templates")}
        onToggleManual={() => vm.setManualOpen((current) => !current)}
      />

      {vm.manualOpen ? (
        <section className="director-ui-manual">
          <div>
            <h3>修改流程</h3>
            <ol>
              <li>先选择玩家端、设计师端、管理员端或总监端。</li>
              <li>在路径树中点击一个页面节点，蓝色高亮表示当前正在编辑的页面。</li>
              <li>在页面配置面板中修改页面名称、布局类型或按钮组件。</li>
              <li>点击保存配置，改动会写入本地配置库；刷新页面后仍会保留。</li>
              <li>点击进入该界面可以跳到选中的真实页面查看当前位置。</li>
            </ol>
          </div>
          <div>
            <h3>布局类型</h3>
            <dl>
              <dt>freeform</dt>
              <dd>自由布局，组件使用 x、y、width、height 描述位置，适合后续做拖拽式页面编辑。</dd>
              <dt>grid</dt>
              <dd>网格布局，组件按列数和间距排列，适合按钮组、卡片列表和管理面板。</dd>
              <dt>stack</dt>
              <dd>纵向堆叠布局，组件从上到下排列，适合表单、说明页和简单详情页。</dd>
            </dl>
          </div>
          <div>
            <h3>按钮配置</h3>
            <p>按钮文案决定页面上看到的文字，图标名预留给后续图标渲染，跳转路径只对 navigate 动作生效。</p>
          </div>
        </section>
      ) : null}

      <div className="director-ui-endpoint-grid">
        {endpointOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`role-card director-ui-endpoint ${option.id === vm.selectedEndpoint ? "active" : ""}`}
            onClick={() => vm.handleEndpointChange(option.id)}
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>

      <section className="director-ui-tree-panel">
        <div className="mini-card-header">
          <div>
            <h3>{endpointOptions.find((option) => option.id === vm.selectedEndpoint)?.label}页面路径</h3>
            <p className="panel-copy">根节点为主界面，只展示会进入独立页面的跳转分支。</p>
          </div>
        </div>
        <ul className="ui-route-tree">{renderRouteTree(vm.selectedTree, vm.selectedRoute, vm.selectRoute)}</ul>
        <div className="director-ui-route-actions">
          <div>
            <p className="meta">已选择：{vm.selectedRoute.label}</p>
            <code>{vm.selectedRoute.path}</code>
            <p className="meta">页面配置：{vm.editingConfig?.id ?? "未找到配置"}</p>
            {vm.selectedRouteIsDynamic ? <p className="feedback error">该路径需要先选择具体归档备份。</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onNavigate(vm.selectedRoute.path)}
            disabled={vm.selectedRouteIsDynamic}
          >
            进入该界面
          </button>
          <button
            type="button"
            onClick={vm.handleOptimizeSelectedPage}
            disabled={vm.selectedRouteIsDynamic}
          >
            优化所选界面
          </button>
        </div>
        {vm.optimizeError ? <p className="feedback error">{vm.optimizeError}</p> : null}
      </section>

      <section className="director-ui-config-panel">
        <div className="mini-card-header">
          <div>
            <h3>页面配置</h3>
            <p className="panel-copy">先编辑页面基础信息和按钮配置，保存后会写入本地配置库。</p>
          </div>
          <button type="button" onClick={vm.handleSaveConfig} disabled={!vm.editingConfig}>
            保存配置
          </button>
        </div>

        {vm.editingConfig ? (
          <>
            <div className="director-ui-config-summary">
              <article>
                <span>页面 ID</span>
                <strong>{vm.editingConfig.id}</strong>
              </article>
              <article>
                <span>路径</span>
                <strong>{vm.editingConfig.path}</strong>
              </article>
              <article>
                <span>端侧</span>
                <strong>{vm.editingConfig.roleScope}</strong>
              </article>
              <article>
                <span>组件数量</span>
                <strong>{vm.editingConfig.components.length}</strong>
              </article>
            </div>

            <div className="director-ui-form-grid">
              <label>
                <span>页面名称</span>
                <input
                  value={vm.editingConfig.name}
                  onChange={(event) =>
                    vm.updateEditingConfig((config) => ({
                      ...config,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>布局类型</span>
                <select
                  value={vm.editingConfig.layout.type}
                  onChange={(event) =>
                    vm.updateEditingConfig((config) => ({
                      ...config,
                      layout: {
                        ...config.layout,
                        type: event.target.value as PageLayoutType,
                      },
                    }))
                  }
                >
                  <option value="freeform">freeform</option>
                  <option value="grid">grid</option>
                  <option value="stack">stack</option>
                </select>
              </label>
            </div>

            <div className="director-ui-button-editor">
              <h4>按钮组件</h4>
              {vm.buttonComponents.length > 0 ? (
                vm.buttonComponents.map((button) => {
                  const actionPath = button.action.type === "navigate" ? button.action.targetPath : "";

                  return (
                    <section key={button.id} className="director-ui-button-row">
                      <div>
                        <strong>{button.id}</strong>
                        <p className="meta">动作类型：{button.action.type}</p>
                      </div>
                      <label>
                        <span>按钮文案</span>
                        <input
                          value={button.label}
                          onChange={(event) =>
                            vm.updateButtonComponent(button.id, (current) => ({
                              ...current,
                              label: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>图标名</span>
                        <input
                          value={button.icon ?? ""}
                          onChange={(event) =>
                            vm.updateButtonComponent(button.id, (current) => ({
                              ...current,
                              icon: event.target.value.trim() || undefined,
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>跳转路径</span>
                        <input
                          value={actionPath}
                          disabled={button.action.type !== "navigate"}
                          onChange={(event) =>
                            vm.updateButtonComponent(button.id, (current) =>
                              current.action.type === "navigate"
                                ? {
                                    ...current,
                                    action: {
                                      ...current.action,
                                      targetPath: event.target.value,
                                    },
                                  }
                                : current,
                            )
                          }
                        />
                      </label>
                    </section>
                  );
                })
              ) : (
                <p className="meta">当前页面还没有按钮组件。</p>
              )}
            </div>
          </>
        ) : (
          <p className="feedback error">未找到该页面的配置。</p>
        )}

        {vm.saveMessage ? <p className="feedback success">{vm.saveMessage}</p> : null}
      </section>
    </section>
  );
};
