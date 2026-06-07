import type { UiEndpoint } from "./ui-customization-objects.js";

export type RouteNode = {
  pageId: string;
  label: string;
  path: string;
  children?: RouteNode[];
};

export type SelectedRoute = {
  pageId: string;
  label: string;
  path: string;
};

export const endpointOptions = [
  { id: "player", label: "玩家端", description: "关卡、社区、商店与个人页" },
  { id: "designer", label: "设计师端", description: "创作入口、编辑器与设计辅助页" },
  { id: "admin", label: "管理员端", description: "社区管理与提案处理" },
  { id: "director", label: "总监端", description: "总监工作台与平台配置" },
] satisfies Array<{ id: UiEndpoint; label: string; description: string }>;

export const routeTrees: Record<UiEndpoint, RouteNode> = {
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
          {
            pageId: "director.levelInterface",
            label: "关卡界面优化",
            path: "/director_console/level_interface_optimization",
          },
          {
            pageId: "shared.levelMap",
            label: "关卡路径地图",
            path: "/levels/map",
          },
        ],
      },
    ],
  },
};

export const isDynamicPath = (path: string) => path.includes("{");
