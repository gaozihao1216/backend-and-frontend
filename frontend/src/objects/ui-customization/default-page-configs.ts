import { PageConfigSchema, type PageConfig, type UiEndpoint } from "./page-config.js";
import { normalizePageComponentIds } from "./page-config-normalizer.js";
import { createLevelChainHomeComponents } from "./level-chain-home-structure.js";
import {
  createAllLevelScreenPageConfigs,
  createLevelMapStageComponents,
  LEVEL_MAP_PAGE_ID,
  LEVEL_MAP_PATH,
} from "./level-map-structure.js";
import {
  applyLevelNodeButtonFormat,
  getDefaultLevelNodeButtonFormatSettings,
} from "../../lib/level-node-button-format.js";

const applyDefaultLevelNodeButtonFormat = (
  pageId: string,
  components: PageConfig["components"],
): PageConfig["components"] =>
  applyLevelNodeButtonFormat(
    {
      id: pageId,
      name: "",
      path: "",
      roleScope: "player",
      layout: { type: "freeform" },
      components,
    },
    getDefaultLevelNodeButtonFormatSettings(),
  ).components;

const percentPosition = (x: number, y: number, width: number, height: number) => ({
  unit: "percent" as const,
  x,
  y,
  width,
  height,
});

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
  createPageConfig(
    LEVEL_MAP_PAGE_ID,
    "关卡路径地图",
    LEVEL_MAP_PATH,
    "player",
    applyDefaultLevelNodeButtonFormat(
      LEVEL_MAP_PAGE_ID,
      createLevelMapStageComponents(LEVEL_MAP_PAGE_ID),
    ),
  ),
  ...createAllLevelScreenPageConfigs(),
  createPageConfig("player.home", "玩家主界面", "/", "player", createLevelChainHomeComponents({
    prefix: "player.home",
    title: "玩家主界面",
    statusLabel: "财富",
    actionLabel: "社区",
    actionOptions: [
      {
        id: "profile",
        label: "个人主页",
        icon: "user",
        action: { type: "navigate", targetPageId: "shared.profile", targetPath: "/own_page" },
      },
      {
        id: "community",
        label: "社区大厅",
        icon: "message-circle",
        action: { type: "navigate", targetPageId: "player.community", targetPath: "/community_hall" },
      },
      {
        id: "shop",
        label: "商店",
        icon: "shopping-bag",
        action: { type: "navigate", targetPageId: "player.shop", targetPath: "/player_shop" },
      },
    ],
  })),
  createPageConfig("player.community", "社区大厅", "/community_hall", "player"),
  createPageConfig("player.shop", "玩家商店", "/player_shop", "player"),

  createPageConfig("designer.home", "设计师主界面", "/", "designer", createLevelChainHomeComponents({
    prefix: "designer.home",
    title: "设计师主界面",
    statusLabel: "身份",
    actionLabel: "创作",
    actionOptions: [
      {
        id: "profile",
        label: "个人主页",
        icon: "user",
        action: { type: "navigate", targetPageId: "shared.profile", targetPath: "/own_page" },
      },
      {
        id: "createMap",
        label: "创造地图",
        icon: "map",
        variant: "primary",
        action: { type: "navigate", targetPageId: "designer.design", targetPath: "/designer/design" },
      },
      {
        id: "birdLab",
        label: "鸟类开发",
        icon: "bird",
        variant: "ghost",
        action: { type: "none" },
      },
    ],
  })),
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

  createPageConfig("admin.home", "管理员主界面", "/", "admin", createLevelChainHomeComponents({
    prefix: "admin.home",
    title: "管理员主界面",
    statusLabel: "身份",
    actionLabel: "管理",
    actionOptions: [
      {
        id: "profile",
        label: "个人主页",
        icon: "user",
        action: { type: "navigate", targetPageId: "shared.profile", targetPath: "/own_page" },
      },
      {
        id: "community",
        label: "社区管理",
        icon: "messages-square",
        variant: "primary",
        action: { type: "navigate", targetPageId: "admin.community", targetPath: "/community_hall" },
      },
      {
        id: "proposals",
        label: "提案处理",
        icon: "clipboard-check",
        variant: "ghost",
        action: { type: "navigate", targetPageId: "admin.proposals", targetPath: "/admin/proposals" },
      },
    ],
  })),
  createPageConfig("admin.community", "社区管理", "/community_hall", "admin"),
  createPageConfig("admin.proposals", "提案处理", "/admin/proposals", "admin", [
    {
      id: "admin.proposals.shell",
      type: "panel",
      title: "{{nickname}}的提案处理工作区",
      position: percentPosition(4, 6, 92, 86),
      style: {
        variant: "secondary",
        backgroundColor: "#fffdfa",
        borderRadius: 14,
      },
      childComponentIds: [
        "admin.proposals.title",
        "admin.proposals.refresh",
        "admin.proposals.pendingPanel",
        "admin.proposals.detailPanel",
      ],
    },
    {
      id: "admin.proposals.title",
      type: "text",
      text: "{{roleLabel}}预览账号 {{nickname}} 正在查看设计师提交的关卡提案。",
      position: percentPosition(3, 5, 54, 10),
      style: {
        backgroundColor: "#f4f9ff",
        textColor: "#12385f",
        borderRadius: 10,
      },
    },
    {
      id: "admin.proposals.refresh",
      type: "button",
      label: "刷新提案",
      icon: "refresh-cw",
      position: percentPosition(73, 6, 20, 8),
      style: {
        variant: "primary",
        borderRadius: 10,
      },
      action: { type: "none" },
    },
    {
      id: "admin.proposals.pendingPanel",
      type: "panel",
      title: "待审核列表",
      position: percentPosition(3, 20, 42, 72),
      style: {
        backgroundColor: "#f7faf5",
        borderRadius: 12,
      },
      childComponentIds: [
        "admin.proposals.pendingText",
        "admin.proposals.openDetail",
      ],
    },
    {
      id: "admin.proposals.pendingText",
      type: "text",
      text: "待审核提案将按 {{apiUserId}} 的权限范围加载。这里用于检查真实账号视角下的列表排布。",
      position: percentPosition(6, 10, 84, 28),
      style: {
        backgroundColor: "#ffffff",
        textColor: "#3e544f",
        borderRadius: 10,
      },
    },
    {
      id: "admin.proposals.openDetail",
      type: "button",
      label: "打开详情面板",
      icon: "panel-right-open",
      position: percentPosition(6, 70, 52, 12),
      style: {
        variant: "secondary",
        borderRadius: 10,
      },
      action: { type: "openPanel", panelId: "admin.proposals.detailPanel" },
    },
    {
      id: "admin.proposals.detailPanel",
      type: "panel",
      title: "提案详情",
      position: percentPosition(49, 20, 48, 72),
      style: {
        backgroundColor: "#fff8ef",
        borderRadius: 12,
      },
      childComponentIds: [
        "admin.proposals.detailText",
        "admin.proposals.reviewPanel",
      ],
    },
    {
      id: "admin.proposals.detailText",
      type: "text",
      text: "{{nickname}} 可以在这里预览提案、填写审核备注，并执行通过或拒绝。",
      position: percentPosition(5, 8, 88, 18),
      style: {
        backgroundColor: "#ffffff",
        textColor: "#5f4a2e",
        borderRadius: 10,
      },
    },
    {
      id: "admin.proposals.reviewPanel",
      type: "panel",
      title: "审核操作",
      position: percentPosition(5, 36, 88, 48),
      style: {
        backgroundColor: "#f4f9ff",
        borderRadius: 12,
      },
      childComponentIds: [
        "admin.proposals.approve",
        "admin.proposals.reject",
      ],
    },
    {
      id: "admin.proposals.approve",
      type: "button",
      label: "通过",
      icon: "check",
      position: percentPosition(8, 22, 34, 18),
      style: {
        variant: "primary",
        borderRadius: 10,
      },
      action: { type: "none" },
    },
    {
      id: "admin.proposals.reject",
      type: "button",
      label: "拒绝",
      icon: "x",
      position: percentPosition(52, 22, 34, 18),
      style: {
        variant: "ghost",
        borderRadius: 10,
      },
      action: { type: "none" },
    },
  ]),

  createPageConfig("director.home", "总监主界面", "/", "director", createLevelChainHomeComponents({
    prefix: "director.home",
    title: "总监主界面",
    statusLabel: "身份",
    actionLabel: "管理",
    actionOptions: [
      {
        id: "profile",
        label: "个人主页",
        icon: "user",
        action: { type: "navigate", targetPageId: "shared.profile", targetPath: "/own_page" },
      },
      {
        id: "workbench",
        label: "总监工作台",
        icon: "settings",
        variant: "primary",
        action: { type: "navigate", targetPageId: "director.workbench", targetPath: "/director_console" },
      },
    ],
  })),
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
  DefaultPageConfigsSchema.parse(defaultPageConfigs.map(normalizePageComponentIds));
