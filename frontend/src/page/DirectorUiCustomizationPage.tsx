import { useState } from "react";

type UiEndpoint = "player" | "designer" | "admin" | "director";

type RouteNode = {
  label: string;
  path: string;
  children?: RouteNode[];
};

type SelectedRoute = {
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
    label: "玩家主界面",
    path: "/",
    children: [
      { label: "个人主页", path: "/own_page" },
      { label: "社区大厅", path: "/community_hall" },
      { label: "玩家商店", path: "/player_shop" },
    ],
  },
  designer: {
    label: "设计师主界面",
    path: "/",
    children: [
      { label: "个人主页", path: "/own_page" },
      {
        label: "创造地图",
        path: "/designer/design",
        children: [
          { label: "设置", path: "/designer/design/settings" },
          { label: "设计手册", path: "/designer/design/design_book" },
          { label: "JSON 检查", path: "/designer/design/json_check" },
          {
            label: "归档备份",
            path: "/designer/design/archive_{backupId}",
            children: [
              { label: "归档 JSON 检查", path: "/designer/design/archive_{backupId}/json_check" },
            ],
          },
        ],
      },
    ],
  },
  admin: {
    label: "管理员主界面",
    path: "/",
    children: [
      { label: "个人主页", path: "/own_page" },
      { label: "社区管理", path: "/community_hall" },
      { label: "提案处理", path: "/admin/proposals" },
    ],
  },
  director: {
    label: "总监主界面",
    path: "/",
    children: [
      { label: "个人主页", path: "/own_page" },
      {
        label: "总监工作台",
        path: "/director_console",
        children: [
          { label: "UI 美化配置", path: "/director_console/ui_customization" },
        ],
      },
    ],
  },
};

const isDynamicPath = (path: string) => path.includes("{");

const renderRouteTree = (
  node: RouteNode,
  selectedRoute: SelectedRoute,
  onSelectRoute: (route: SelectedRoute) => void,
) => (
  <li key={`${node.label}-${node.path}`}>
    <button
      type="button"
      className={`ui-route-node ${node.path === selectedRoute.path && node.label === selectedRoute.label ? "selected" : ""}`}
      onClick={() => onSelectRoute({ label: node.label, path: node.path })}
    >
      <strong>{node.label}</strong>
      <code>{node.path}</code>
    </button>
    {node.children ? (
      <ul>{node.children.map((child) => renderRouteTree(child, selectedRoute, onSelectRoute))}</ul>
    ) : null}
  </li>
);

export const DirectorUiCustomizationPage = ({ onNavigate }: DirectorUiCustomizationPageProps) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<UiEndpoint>("player");
  const [selectedRoute, setSelectedRoute] = useState<SelectedRoute>(() => routeTrees.player);
  const selectedTree = routeTrees[selectedEndpoint];
  const selectedRouteIsDynamic = isDynamicPath(selectedRoute.path);

  const handleEndpointChange = (endpoint: UiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setSelectedRoute(routeTrees[endpoint]);
  };

  return (
    <section className="panel director-ui-page">
      <div className="feature-header">
        <div>
          <h2>UI 美化配置</h2>
          <p className="panel-copy">选择端侧后查看当前页面路径关系，后续可在这里继续挂接主题、布局和页面配置。</p>
        </div>
        <div className="feature-pill">路径树</div>
      </div>

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
        <ul className="ui-route-tree">{renderRouteTree(selectedTree, selectedRoute, setSelectedRoute)}</ul>
        <div className="director-ui-route-actions">
          <div>
            <p className="meta">已选择：{selectedRoute.label}</p>
            <code>{selectedRoute.path}</code>
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
    </section>
  );
};
