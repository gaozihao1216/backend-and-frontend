import { useState } from "react";
import { getPageConfig, savePageConfig } from "../lib/ui-customization.js";
import type {
  ButtonComponent,
  PageConfig,
  PageLayoutType,
  UiEndpoint,
} from "../objects/ui-customization/ui-customization-objects.js";

type RouteNode = {
  pageId: string;
  label: string;
  path: string;
  children?: RouteNode[];
};

type SelectedRoute = {
  pageId: string;
  label: string;
  path: string;
};

type DirectorUiCustomizationPageProps = {
  onNavigate: (path: string) => void;
};

const endpointOptions = [
  { id: "player", label: "玩家端", description: "关卡、社区、商店与个人页" },
  { id: "designer", label: "设计师端", description: "创作入口、编辑器与设计辅助页" },
  { id: "admin", label: "管理员端", description: "社区管理与提案处理" },
  { id: "director", label: "总监端", description: "总监工作台与平台配置" },
] satisfies Array<{ id: UiEndpoint; label: string; description: string }>;

const routeTrees: Record<UiEndpoint, RouteNode> = {
  player: {
    pageId: "player.home",
    label: "玩家主界面",
    path: "/",
    children: [
      { pageId: "shared.profile", label: "个人主页", path: "/own_page" },
      { pageId: "player.community", label: "社区大厅", path: "/community_hall" },
      { pageId: "player.shop", label: "玩家商店", path: "/player_shop" },
    ],
  },
  designer: {
    pageId: "designer.home",
    label: "设计师主界面",
    path: "/",
    children: [
      { pageId: "shared.profile", label: "个人主页", path: "/own_page" },
      {
        pageId: "designer.design",
        label: "创造地图",
        path: "/designer/design",
        children: [
          { pageId: "designer.settings", label: "设置", path: "/designer/design/settings" },
          { pageId: "designer.designBook", label: "设计手册", path: "/designer/design/design_book" },
          { pageId: "designer.jsonCheck", label: "JSON 检查", path: "/designer/design/json_check" },
          {
            pageId: "designer.archive",
            label: "归档备份",
            path: "/designer/design/archive_{backupId}",
            children: [
              {
                pageId: "designer.archiveJsonCheck",
                label: "归档 JSON 检查",
                path: "/designer/design/archive_{backupId}/json_check",
              },
            ],
          },
        ],
      },
    ],
  },
  admin: {
    pageId: "admin.home",
    label: "管理员主界面",
    path: "/",
    children: [
      { pageId: "shared.profile", label: "个人主页", path: "/own_page" },
      { pageId: "admin.community", label: "社区管理", path: "/community_hall" },
      { pageId: "admin.proposals", label: "提案处理", path: "/admin/proposals" },
    ],
  },
  director: {
    pageId: "director.home",
    label: "总监主界面",
    path: "/",
    children: [
      { pageId: "shared.profile", label: "个人主页", path: "/own_page" },
      {
        pageId: "director.workbench",
        label: "总监工作台",
        path: "/director_console",
        children: [
          {
            pageId: "director.uiCustomization",
            label: "UI 美化配置",
            path: "/director_console/ui_customization",
          },
        ],
      },
    ],
  },
};

const isDynamicPath = (path: string) => path.includes("{");

const getEditablePageConfig = (pageId: string): PageConfig | null => {
  const config = getPageConfig(pageId);
  return config ? structuredClone(config) : null;
};

const isButtonComponent = (component: PageConfig["components"][number]): component is ButtonComponent =>
  component.type === "button";

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
  const [selectedEndpoint, setSelectedEndpoint] = useState<UiEndpoint>("player");
  const [selectedRoute, setSelectedRoute] = useState<SelectedRoute>(() => routeTrees.player);
  const [editingConfig, setEditingConfig] = useState<PageConfig | null>(() => getEditablePageConfig(routeTrees.player.pageId));
  const [saveMessage, setSaveMessage] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const selectedTree = routeTrees[selectedEndpoint];
  const selectedRouteIsDynamic = isDynamicPath(selectedRoute.path);
  const buttonComponents = editingConfig?.components.filter(isButtonComponent) ?? [];

  const selectRoute = (route: SelectedRoute) => {
    setSelectedRoute(route);
    setEditingConfig(getEditablePageConfig(route.pageId));
    setSaveMessage("");
  };

  const handleEndpointChange = (endpoint: UiEndpoint) => {
    setSelectedEndpoint(endpoint);
    selectRoute(routeTrees[endpoint]);
  };

  const updateEditingConfig = (updater: (config: PageConfig) => PageConfig) => {
    setEditingConfig((current) => current ? updater(current) : current);
    setSaveMessage("");
  };

  const updateButtonComponent = (
    buttonId: string,
    updater: (button: ButtonComponent) => ButtonComponent,
  ) => {
    updateEditingConfig((config) => ({
      ...config,
      components: config.components.map((component) =>
        component.type === "button" && component.id === buttonId ? updater(component) : component,
      ),
    }));
  };

  const handleSaveConfig = () => {
    if (!editingConfig) {
      return;
    }

    const savedConfig = savePageConfig(editingConfig);
    setEditingConfig(structuredClone(savedConfig));
    setSaveMessage("配置已保存到本地。");
  };

  return (
    <section className="panel director-ui-page">
      <div className="feature-header">
        <div>
          <h2>UI 美化配置</h2>
          <p className="panel-copy">选择端侧后查看当前页面路径关系，后续可在这里继续挂接主题、布局和页面配置。</p>
        </div>
        <div className="director-ui-header-actions">
          <button type="button" className="secondary" onClick={() => setManualOpen((current) => !current)}>
            说明书
          </button>
          <div className="feature-pill">路径树</div>
        </div>
      </div>

      {manualOpen ? (
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
            className={`role-card director-ui-endpoint ${option.id === selectedEndpoint ? "active" : ""}`}
            onClick={() => handleEndpointChange(option.id)}
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>

      <section className="director-ui-tree-panel">
        <div className="mini-card-header">
          <div>
            <h3>{endpointOptions.find((option) => option.id === selectedEndpoint)?.label}页面路径</h3>
            <p className="panel-copy">根节点为主界面，只展示会进入独立页面的跳转分支。</p>
          </div>
        </div>
        <ul className="ui-route-tree">{renderRouteTree(selectedTree, selectedRoute, selectRoute)}</ul>
        <div className="director-ui-route-actions">
          <div>
            <p className="meta">已选择：{selectedRoute.label}</p>
            <code>{selectedRoute.path}</code>
            <p className="meta">页面配置：{editingConfig?.id ?? "未找到配置"}</p>
            {selectedRouteIsDynamic ? <p className="feedback error">该路径需要先选择具体归档备份。</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onNavigate(selectedRoute.path)}
            disabled={selectedRouteIsDynamic}
          >
            进入该界面
          </button>
        </div>
      </section>

      <section className="director-ui-config-panel">
        <div className="mini-card-header">
          <div>
            <h3>页面配置</h3>
            <p className="panel-copy">先编辑页面基础信息和按钮配置，保存后会写入本地配置库。</p>
          </div>
          <button type="button" onClick={handleSaveConfig} disabled={!editingConfig}>
            保存配置
          </button>
        </div>

        {editingConfig ? (
          <>
            <div className="director-ui-config-summary">
              <article>
                <span>页面 ID</span>
                <strong>{editingConfig.id}</strong>
              </article>
              <article>
                <span>路径</span>
                <strong>{editingConfig.path}</strong>
              </article>
              <article>
                <span>端侧</span>
                <strong>{editingConfig.roleScope}</strong>
              </article>
              <article>
                <span>组件数量</span>
                <strong>{editingConfig.components.length}</strong>
              </article>
            </div>

            <div className="director-ui-form-grid">
              <label>
                <span>页面名称</span>
                <input
                  value={editingConfig.name}
                  onChange={(event) =>
                    updateEditingConfig((config) => ({
                      ...config,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>布局类型</span>
                <select
                  value={editingConfig.layout.type}
                  onChange={(event) =>
                    updateEditingConfig((config) => ({
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
              {buttonComponents.length > 0 ? (
                buttonComponents.map((button) => {
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
                            updateButtonComponent(button.id, (current) => ({
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
                            updateButtonComponent(button.id, (current) => ({
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
                            updateButtonComponent(button.id, (current) =>
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

        {saveMessage ? <p className="feedback success">{saveMessage}</p> : null}
      </section>
    </section>
  );
};
