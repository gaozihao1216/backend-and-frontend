import { PageConfigSchema, type PageConfig, type UiEndpoint } from "../ui/page-config.js";
import { normalizePageConfig } from "./page-config-normalizer.js";
import { createLevelChainHomeComponents } from "./level-chain-home-structure.js";
import { createAdminProposalsPageConfig } from "./admin-proposals-structure.js";
import {
  createAllLevelScreenPageConfigs,
  createLevelMapStageComponents,
  LEVEL_MAP_PAGE_ID,
  LEVEL_MAP_PATH,
} from "./level-map-structure.js";
import {
  applyLevelNodeButtonFormat,
  getDefaultLevelNodeButtonFormatSettings,
} from "../../page/shared/function/level-map/level-node-button-format.js";

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
      surfaceMode: "composed",
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
  surfaceMode: PageConfig["surfaceMode"] = "composed",
): PageConfig => ({
  id,
  name,
  path,
  roleScope,
  layout: { type: "freeform", gap: 12, padding: 24 },
  surfaceMode,
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
  createPageConfig("player.social", "好友与私聊", "/player_social", "player"),
  createPageConfig("player.preparation", "备战区域", "/player_preparation", "player"),

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
        id: "portfolio",
        label: "作品集",
        icon: "folder",
        variant: "ghost",
        action: { type: "navigate", targetPageId: "designer.portfolio", targetPath: "/designer/portfolio" },
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
        action: { type: "navigate", targetPageId: "designer.birds", targetPath: "/designer/birds" },
      },
    ],
  })),
  createPageConfig("designer.design", "创造地图", "/designer/design", "designer"),
  createPageConfig("designer.portfolio", "作品集", "/designer/portfolio", "designer"),
  createPageConfig("designer.birds", "鸟类开发", "/designer/birds", "designer"),
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
      {
        id: "auditLogs",
        label: "审核审计",
        icon: "scroll-text",
        variant: "ghost",
        action: { type: "navigate", targetPageId: "admin.auditLogs", targetPath: "/admin/audit-logs" },
      },
      {
        id: "shopManagement",
        label: "商店管理",
        icon: "shopping-bag",
        variant: "ghost",
        action: { type: "navigate", targetPageId: "admin.shopManagement", targetPath: "/admin/shop" },
      },
    ],
  })),
  createPageConfig("admin.community", "社区管理", "/community_hall", "admin"),
  createAdminProposalsPageConfig(),
  createPageConfig("admin.auditLogs", "审核审计", "/admin/audit-logs", "admin"),
  createPageConfig("admin.shopManagement", "商店管理", "/admin/shop", "admin"),

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
  createPageConfig(
    "director.levelInterface",
    "关卡界面优化",
    "/director_console/level_interface_optimization",
    "director",
  ),
  createPageConfig("director.levelAssignment", "关卡细节分配", "/director_console/level_assignment", "director"),
  createPageConfig("director.birdSkillLab", "鸟类技能实验室", "/director_console/bird_skill_lab", "director"),
  createPageConfig(
    "director.levelBackgroundTemplates",
    "关卡背景模板",
    "/director_console/level_background_templates",
    "director",
  ),
  createPageConfig(
    "director.buttonTemplates",
    "模板库",
    "/director_console/ui_customization/button_templates",
    "director",
  ),
] satisfies PageConfig[];

export const DefaultPageConfigsSchema = PageConfigSchema.array();

export const getDefaultPageConfigs = (): PageConfig[] =>
  DefaultPageConfigsSchema.parse(defaultPageConfigs.map(normalizePageConfig));
