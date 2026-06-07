import type { AuthUser } from "./auth.js";
import {
  getLevelScreenPageId,
  LEVEL_MAP_PAGE_ID,
  LEVEL_MAP_PATH,
} from "../objects/ui-customization/level-map-structure.js";

const DESIGNER_HOME_PATH = "/designer";
const DESIGNER_PORTFOLIO_PATH = "/designer/portfolio";
const DESIGNER_BIRDS_PATH = "/designer/birds";
const DESIGNER_RESUBMIT_PATH_PREFIX = "/designer/resubmit/";
const DESIGNER_DESIGN_PATH = "/designer/design";
const DESIGNER_SETTINGS_PATH = "/designer/design/settings";
const DESIGNER_GUIDE_PATH = "/designer/design/design_book";
const DESIGNER_JSON_CHECK_PATH = "/designer/design/json_check";
const DESIGNER_ARCHIVE_PATH_PREFIX = "/designer/design/archive_";
const DESIGNER_ARCHIVE_JSON_CHECK_SUFFIX = "/json_check";
const OWN_PAGE_PATH = "/own_page";
const COMMUNITY_HALL_PATH = "/community_hall";
const PLAYER_SHOP_PATH = "/player_shop";
const PLAYER_SOCIAL_PATH = "/player_social";
const PLAYER_PREPARATION_PATH = "/player_preparation";
const ADMIN_PROPOSALS_PATH = "/admin/proposals";
const DIRECTOR_CONSOLE_PATH = "/director_console";
const DIRECTOR_UI_CUSTOMIZATION_PATH = "/director_console/ui_customization";
const DIRECTOR_LEVEL_INTERFACE_PATH = "/director_console/level_interface_optimization";
const DIRECTOR_LEVEL_ASSIGNMENT_PATH = "/director_console/level_assignment";
const DIRECTOR_BIRD_SKILL_LAB_PATH = "/director_console/bird_skill_lab";
const DIRECTOR_LEVEL_BACKGROUND_TEMPLATES_PATH = "/director_console/level_background_templates";
const DIRECTOR_BUTTON_TEMPLATES_PATH = "/director_console/ui_customization/button_templates";
const PAGE_BUILDER_UPDATE_SUFFIX = "/update";
const BUTTON_DESIGN_SUFFIX = "/button_design";
const BUTTON_CONFIG_SUFFIX = "/button_config";
const PANEL_CREATE_SUFFIX = "/panel_create";

export const resolveHomePageId = (user: AuthUser): string => {
  if (user.role === "player") {
    return "player.home";
  }

  if (user.role === "designer") {
    return "designer.home";
  }

  if (user.role === "admin" && user.adminLevel === "director") {
    return "director.home";
  }

  return "admin.home";
};

export const isPageBuilderPath = (pathname: string) =>
  pathname.endsWith(PAGE_BUILDER_UPDATE_SUFFIX)
  || pathname.endsWith(BUTTON_DESIGN_SUFFIX)
  || pathname.endsWith(BUTTON_CONFIG_SUFFIX)
  || pathname.endsWith(PANEL_CREATE_SUFFIX);

export const resolvePageId = (
  pathname: string,
  user: AuthUser | null,
  search = "",
): string | null => {
  if (pathname === LEVEL_MAP_PATH) {
    return LEVEL_MAP_PAGE_ID;
  }

  const levelMatch = pathname.match(/^\/levels\/(level\d{2})$/);
  if (levelMatch?.[1]) {
    return getLevelScreenPageId(levelMatch[1]);
  }

  if (pathname === "/") {
    return user ? resolveHomePageId(user) : null;
  }

  if (pathname === OWN_PAGE_PATH) {
    return "shared.profile";
  }

  if (pathname === COMMUNITY_HALL_PATH) {
    return user?.role === "admin" ? "admin.community" : "player.community";
  }

  if (pathname === PLAYER_SHOP_PATH) {
    return "player.shop";
  }

  if (pathname === PLAYER_SOCIAL_PATH) {
    return "player.social";
  }

  if (pathname === PLAYER_PREPARATION_PATH) {
    return "player.preparation";
  }

  if (pathname === ADMIN_PROPOSALS_PATH) {
    return "admin.proposals";
  }

  if (pathname === DIRECTOR_CONSOLE_PATH) {
    return "director.workbench";
  }

  if (pathname === DIRECTOR_UI_CUSTOMIZATION_PATH) {
    return "director.uiCustomization";
  }

  if (pathname === DIRECTOR_LEVEL_INTERFACE_PATH) {
    return "director.levelInterface";
  }

  if (pathname === DIRECTOR_LEVEL_ASSIGNMENT_PATH) {
    return "director.levelAssignment";
  }

  if (pathname === DIRECTOR_BIRD_SKILL_LAB_PATH) {
    return "director.birdSkillLab";
  }

  if (pathname === DIRECTOR_LEVEL_BACKGROUND_TEMPLATES_PATH) {
    return "director.levelBackgroundTemplates";
  }

  if (pathname === DIRECTOR_BUTTON_TEMPLATES_PATH) {
    return "director.buttonTemplates";
  }

  if (pathname === DESIGNER_HOME_PATH) {
    return "designer.home";
  }

  if (pathname === DESIGNER_PORTFOLIO_PATH) {
    return "designer.portfolio";
  }

  if (pathname === DESIGNER_BIRDS_PATH) {
    return "designer.birds";
  }

  if (pathname.startsWith(DESIGNER_RESUBMIT_PATH_PREFIX)) {
    return null;
  }

  if (
    pathname === DESIGNER_DESIGN_PATH
    || pathname === DESIGNER_SETTINGS_PATH
    || pathname === DESIGNER_GUIDE_PATH
    || pathname === DESIGNER_JSON_CHECK_PATH
    || pathname.startsWith(DESIGNER_ARCHIVE_PATH_PREFIX)
  ) {
    const isArchiveJsonCheckPath =
      pathname.startsWith(DESIGNER_ARCHIVE_PATH_PREFIX)
      && pathname.endsWith(DESIGNER_ARCHIVE_JSON_CHECK_SUFFIX);
    if (isArchiveJsonCheckPath) {
      return "designer.archiveJsonCheck";
    }

    if (pathname === DESIGNER_SETTINGS_PATH) {
      return "designer.settings";
    }

    if (pathname === DESIGNER_GUIDE_PATH) {
      return "designer.designBook";
    }

    if (pathname === DESIGNER_JSON_CHECK_PATH) {
      return "designer.jsonCheck";
    }

    if (pathname.startsWith(DESIGNER_ARCHIVE_PATH_PREFIX)) {
      return "designer.archive";
    }

    return "designer.design";
  }

  return null;
};
