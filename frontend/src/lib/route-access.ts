import type { AuthUser } from "./auth.js";
import { isPageBuilderPath } from "./page-id-resolver.js";

export type RouteAccessDenial = {
  title: string;
  message: string;
};

export const ADMIN_PROPOSALS_PATH = "/admin/proposals";
export const ADMIN_AUDIT_LOGS_PATH = "/admin/audit-logs";
export const ADMIN_SHOP_PATH = "/admin/shop";

const STANDARD_ADMIN_PATHS = [
  ADMIN_PROPOSALS_PATH,
  ADMIN_AUDIT_LOGS_PATH,
  ADMIN_SHOP_PATH,
] as const;

const STANDARD_ADMIN_FEATURE_TITLES: Record<(typeof STANDARD_ADMIN_PATHS)[number], string> = {
  [ADMIN_PROPOSALS_PATH]: "提案处理",
  [ADMIN_AUDIT_LOGS_PATH]: "审核审计",
  [ADMIN_SHOP_PATH]: "商店管理",
};
export const DIRECTOR_CONSOLE_PATH = "/director_console";
export const DIRECTOR_UI_CUSTOMIZATION_PATH = "/director_console/ui_customization";
export const DIRECTOR_LEVEL_INTERFACE_PATH = "/director_console/level_interface_optimization";
export const DIRECTOR_LEVEL_ASSIGNMENT_PATH = "/director_console/level_assignment";
export const DIRECTOR_BIRD_SKILL_LAB_PATH = "/director_console/bird_skill_lab";
export const DIRECTOR_LEVEL_BACKGROUND_TEMPLATES_PATH = "/director_console/level_background_templates";
export const DIRECTOR_BUTTON_TEMPLATES_PATH = "/director_console/ui_customization/button_templates";

const DIRECTOR_CONSOLE_PATHS = [
  DIRECTOR_CONSOLE_PATH,
  DIRECTOR_UI_CUSTOMIZATION_PATH,
  DIRECTOR_LEVEL_INTERFACE_PATH,
  DIRECTOR_LEVEL_ASSIGNMENT_PATH,
  DIRECTOR_BIRD_SKILL_LAB_PATH,
  DIRECTOR_LEVEL_BACKGROUND_TEMPLATES_PATH,
  DIRECTOR_BUTTON_TEMPLATES_PATH,
] as const;

export const isDirectorConsolePath = (pathname: string): boolean =>
  DIRECTOR_CONSOLE_PATHS.includes(pathname as (typeof DIRECTOR_CONSOLE_PATHS)[number])
  || isPageBuilderPath(pathname);

export const isStandardAdminPath = (pathname: string): boolean =>
  STANDARD_ADMIN_PATHS.includes(pathname as (typeof STANDARD_ADMIN_PATHS)[number]);

export const checkDirectorConsoleAccess = (user: AuthUser): RouteAccessDenial | null => {
  if (user.role !== "admin") {
    return {
      title: "总监控制台",
      message: "当前账号不是管理员，无法访问总监控制台。",
    };
  }

  if (user.adminLevel !== "director") {
    return {
      title: "总监控制台",
      message: "当前账号不是总监管理员，无法访问总监控制台。",
    };
  }

  return null;
};

export const checkStandardAdminAccess = (
  user: AuthUser,
  featureTitle: string,
): RouteAccessDenial | null => {
  if (user.role !== "admin") {
    return {
      title: featureTitle,
      message: `当前账号不是管理员，无法访问${featureTitle}页面。`,
    };
  }

  if (user.adminLevel === "director") {
    return {
      title: featureTitle,
      message: "总监管理员请使用总监控制台；该功能仅面向普通管理员。",
    };
  }

  if (user.adminLevel !== "standard") {
    return {
      title: featureTitle,
      message: `请先绑定普通管理员账号（如 admin-1）后再访问${featureTitle}。`,
    };
  }

  return null;
};

export const checkStandardAdminProposalsAccess = (user: AuthUser): RouteAccessDenial | null =>
  checkStandardAdminAccess(user, "提案处理");

export const checkRouteAccess = (pathname: string, user: AuthUser): RouteAccessDenial | null => {
  if (isDirectorConsolePath(pathname)) {
    return checkDirectorConsoleAccess(user);
  }

  if (isStandardAdminPath(pathname)) {
    const featureTitle = STANDARD_ADMIN_FEATURE_TITLES[pathname as (typeof STANDARD_ADMIN_PATHS)[number]];
    return checkStandardAdminAccess(user, featureTitle);
  }

  return null;
};
