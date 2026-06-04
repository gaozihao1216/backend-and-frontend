import { PageConfigSchema, type PageConfig, type UiEndpoint } from "./page-config.js";

const createPageConfig = (
  id: string,
  name: string,
  path: string,
  roleScope: UiEndpoint,
  components: PageConfig["components"] = [],
): PageConfig => ({
  id,
  name,
  path,
  roleScope,
  layout: { type: "freeform", gap: 12, padding: 24 },
  components,
});

export const defaultPageConfigs = [
  createPageConfig("shared.profile", "个人主页", "/own_page", "player"),
  createPageConfig("player.home", "玩家主界面", "/", "player", [
    {
      id: "player.profile.button",
      type: "button",
      label: "个人主页",
      icon: "user",
      position: { x: 24, y: 24, width: 144, height: 44 },
      action: { type: "navigate", targetPageId: "shared.profile", targetPath: "/own_page" },
    },
    {
      id: "player.community.button",
      type: "button",
      label: "社区大厅",
      icon: "message-circle",
      position: { x: 24, y: 80, width: 144, height: 44 },
      action: { type: "navigate", targetPageId: "player.community", targetPath: "/community_hall" },
    },
    {
      id: "player.shop.button",
      type: "button",
      label: "玩家商店",
      icon: "shopping-bag",
      position: { x: 24, y: 136, width: 144, height: 44 },
      action: { type: "navigate", targetPageId: "player.shop", targetPath: "/player_shop" },
    },
  ]),
  createPageConfig("player.community", "社区大厅", "/community_hall", "player"),
  createPageConfig("player.shop", "玩家商店", "/player_shop", "player"),

  createPageConfig("designer.home", "设计师主界面", "/", "designer", [
    {
      id: "designer.profile.button",
      type: "button",
      label: "个人主页",
      icon: "user",
      position: { x: 24, y: 24, width: 144, height: 44 },
      action: { type: "navigate", targetPageId: "shared.profile", targetPath: "/own_page" },
    },
    {
      id: "designer.design.button",
      type: "button",
      label: "创造地图",
      icon: "map",
      position: { x: 24, y: 80, width: 144, height: 44 },
      action: { type: "navigate", targetPageId: "designer.design", targetPath: "/designer/design" },
    },
  ]),
  createPageConfig("designer.design", "创造地图", "/designer/design", "designer"),
  createPageConfig("designer.settings", "设置", "/designer/design/settings", "designer"),
  createPageConfig("designer.designBook", "设计手册", "/designer/design/design_book", "designer"),
  createPageConfig("designer.jsonCheck", "JSON 检查", "/designer/design/json_check", "designer"),
  createPageConfig("designer.archive", "归档备份", "/designer/design/archive_{backupId}", "designer"),
  createPageConfig(
    "designer.archiveJsonCheck",
    "归档 JSON 检查",
    "/designer/design/archive_{backupId}/json_check",
    "designer",
  ),

  createPageConfig("admin.home", "管理员主界面", "/", "admin", [
    {
      id: "admin.profile.button",
      type: "button",
      label: "个人主页",
      icon: "user",
      position: { x: 24, y: 24, width: 144, height: 44 },
      action: { type: "navigate", targetPageId: "shared.profile", targetPath: "/own_page" },
    },
    {
      id: "admin.community.button",
      type: "button",
      label: "社区管理",
      icon: "messages-square",
      position: { x: 24, y: 80, width: 144, height: 44 },
      action: { type: "navigate", targetPageId: "admin.community", targetPath: "/community_hall" },
    },
    {
      id: "admin.proposals.button",
      type: "button",
      label: "提案处理",
      icon: "clipboard-check",
      position: { x: 24, y: 136, width: 144, height: 44 },
      action: { type: "navigate", targetPageId: "admin.proposals", targetPath: "/admin/proposals" },
    },
  ]),
  createPageConfig("admin.community", "社区管理", "/community_hall", "admin"),
  createPageConfig("admin.proposals", "提案处理", "/admin/proposals", "admin"),

  createPageConfig("director.home", "总监主界面", "/", "director", [
    {
      id: "director.profile.button",
      type: "button",
      label: "个人主页",
      icon: "user",
      position: { x: 24, y: 24, width: 144, height: 44 },
      action: { type: "navigate", targetPageId: "shared.profile", targetPath: "/own_page" },
    },
    {
      id: "director.workbench.button",
      type: "button",
      label: "总监工作台",
      icon: "settings",
      position: { x: 24, y: 80, width: 144, height: 44 },
      action: { type: "navigate", targetPageId: "director.workbench", targetPath: "/director_console" },
    },
  ]),
  createPageConfig("director.workbench", "总监工作台", "/director_console", "director"),
  createPageConfig(
    "director.uiCustomization",
    "UI 美化配置",
    "/director_console/ui_customization",
    "director",
  ),
] satisfies PageConfig[];

export const DefaultPageConfigsSchema = PageConfigSchema.array();

export const getDefaultPageConfigs = (): PageConfig[] =>
  DefaultPageConfigsSchema.parse(defaultPageConfigs);
