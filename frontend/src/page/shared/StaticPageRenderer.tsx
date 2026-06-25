import type { ReactNode } from "react";
import type { AuthUser } from "../../lib/auth.js";
import { LEVEL_MAP_PAGE_ID, LEVEL_NODE_DEFINITIONS, getLevelScreenPageId } from "../../objects/ui-customization/level-map-structure.js";
import { DynamicPageHost } from "./DynamicPageHost.js";
import { StaticLevelScreenPreview } from "../../components/level/static-level-previews.js";
import { AdminAuditLogsPage } from "../admin/AdminAuditLogsPage/index.js";
import { AdminCommunityPage } from "../admin/AdminCommunityPage/index.js";
import { AdminProposalReviewPage } from "../admin/AdminProposalReviewPage/index.js";
import { AdminShopPage } from "../admin/AdminShopPage/index.js";
import { DesignerBirdLabPage } from "../designer/DesignerBirdLabPage/index.js";
import { DesignerPortfolioPage } from "../designer/DesignerPortfolioPage/index.js";
import { DesignerLevelEditorPage } from "../designer/DesignerLevelEditorPage/index.js";
import { DirectorBirdSkillLabPage } from "../director/DirectorBirdSkillLabPage/index.js";
import { DirectorButtonTemplatesPage } from "../director/DirectorButtonTemplatesPage/index.js";
import { DirectorLevelAssignmentPage } from "../director/DirectorLevelAssignmentPage/index.js";
import { DirectorLevelBackgroundTemplatesPage } from "../director/DirectorLevelBackgroundTemplatesPage/index.js";
import { DirectorLevelInterfacePage } from "../director/DirectorLevelInterfacePage/index.js";
import { DirectorUiCustomizationPage } from "../director/DirectorUiCustomizationPage/index.js";
import { DirectorWorkbenchPage } from "../director/DirectorWorkbenchPage/index.js";
import { PlayerCommunityPage } from "../player/PlayerCommunityPage/index.js";
import { PlayerPreparationPage } from "../player/PlayerPreparationPage/index.js";
import { PlayerShopPage } from "../player/PlayerShopPage/index.js";
import { PlayerSocialPage } from "../player/PlayerSocialPage/index.js";
import { UserProfilePage } from "../profile/UserProfilePage/index.js";

const DESIGNER_HOME_PATH = "/designer";
const DESIGNER_PORTFOLIO_PATH = "/designer/portfolio";
const DESIGNER_BIRDS_PATH = "/designer/birds";
const DESIGNER_DESIGN_PATH = "/designer/design";
const DESIGNER_SETTINGS_PATH = "/designer/design/settings";
const DESIGNER_GUIDE_PATH = "/designer/design/design_book";
const DESIGNER_JSON_CHECK_PATH = "/designer/design/json_check";
const DESIGNER_ARCHIVE_PATH_PREFIX = "/designer/design/archive_";
const DESIGNER_ARCHIVE_JSON_CHECK_SUFFIX = "/json_check";
const DIRECTOR_CONSOLE_PATH = "/director_console";
const DIRECTOR_UI_CUSTOMIZATION_PATH = "/director_console/ui_customization";
const DIRECTOR_LEVEL_INTERFACE_PATH = "/director_console/level_interface_optimization";
const DIRECTOR_LEVEL_ASSIGNMENT_PATH = "/director_console/level_assignment";
const DIRECTOR_BIRD_SKILL_LAB_PATH = "/director_console/bird_skill_lab";
const DIRECTOR_LEVEL_BACKGROUND_TEMPLATES_PATH = "/director_console/level_background_templates";
const DIRECTOR_BUTTON_TEMPLATES_PATH = "/director_console/ui_customization/button_templates";

export type StaticPageRenderContext = {
  user: AuthUser;
  pathname: string;
  search: string;
  onNavigate: (path: string) => void;
  onOpenSettings?: () => void;
  onUserUpdated?: (user: AuthUser) => void;
  onLogout?: () => void;
  onOpenDesignerDesign?: () => void;
  onOpenDesignerPortfolio?: () => void;
};

const unsupportedStaticPage = (pageId: string) => (
  <section className="panel page-builder-preview-error">
    <h2>暂未接入静态页面</h2>
    <p className="panel-copy">该 pageId 还没有映射到真实 React 页面组件。</p>
    <code>{pageId}</code>
  </section>
);

const resolveDesignerLevelEditorMode = (pathname: string) => {
  const isArchiveJsonCheckPath =
    pathname.startsWith(DESIGNER_ARCHIVE_PATH_PREFIX)
    && pathname.endsWith(DESIGNER_ARCHIVE_JSON_CHECK_SUFFIX);
  const archiveBackupId = pathname.startsWith(DESIGNER_ARCHIVE_PATH_PREFIX)
    ? pathname
        .slice(DESIGNER_ARCHIVE_PATH_PREFIX.length)
        .replace(DESIGNER_ARCHIVE_JSON_CHECK_SUFFIX, "")
    : undefined;

  if (isArchiveJsonCheckPath) {
    return { mode: "archive_json_check" as const, archiveBackupId };
  }

  if (pathname === DESIGNER_SETTINGS_PATH) {
    return { mode: "settings" as const, archiveBackupId: undefined };
  }

  if (pathname === DESIGNER_GUIDE_PATH) {
    return { mode: "design_book" as const, archiveBackupId: undefined };
  }

  if (pathname === DESIGNER_JSON_CHECK_PATH) {
    return { mode: "json_check" as const, archiveBackupId: undefined };
  }

  if (pathname.startsWith(DESIGNER_ARCHIVE_PATH_PREFIX)) {
    return { mode: "archive" as const, archiveBackupId };
  }

  return { mode: "design" as const, archiveBackupId: undefined };
};

const staticPageIds = new Set([
  "shared.profile",
  LEVEL_MAP_PAGE_ID,
  "player.home",
  "player.community",
  "player.shop",
  "player.social",
  "player.preparation",
  "designer.home",
  "designer.design",
  "designer.portfolio",
  "designer.birds",
  "designer.settings",
  "designer.designBook",
  "designer.jsonCheck",
  "designer.archive",
  "designer.archiveJsonCheck",
  "admin.home",
  "admin.community",
  "admin.proposals",
  "admin.auditLogs",
  "admin.shopManagement",
  "director.home",
  "director.workbench",
  "director.uiCustomization",
  "director.levelInterface",
  "director.levelAssignment",
  "director.birdSkillLab",
  "director.levelBackgroundTemplates",
  "director.buttonTemplates",
  ...LEVEL_NODE_DEFINITIONS.map((node) => getLevelScreenPageId(node.suffix)),
]);

const renderConfigDrivenPage = (pageId: string, context: StaticPageRenderContext) => (
  <DynamicPageHost
    pageId={pageId}
    runtimeUserId={context.user.apiUserId ?? undefined}
    onNavigate={context.onNavigate}
    embedded
    staticContext={context}
  />
);

export const isStaticPageSupported = (pageId: string) => {
  if (staticPageIds.has(pageId)) {
    return true;
  }

  return /^shared\.level\.level\d{2}$/.test(pageId);
};

export const renderStaticPage = (pageId: string, context: StaticPageRenderContext): ReactNode => {
  const { user, pathname, search, onNavigate } = context;
  const apiUserId = user.apiUserId;

  if (pageId === LEVEL_MAP_PAGE_ID) {
    return renderConfigDrivenPage(pageId, context);
  }

  const levelScreenMatch = pageId.match(/^shared\.level\.(level\d{2})$/);
  if (levelScreenMatch?.[1]) {
    return <StaticLevelScreenPreview levelSuffix={levelScreenMatch[1]} onNavigate={onNavigate} />;
  }

  switch (pageId) {
    case "player.home":
    case "designer.home":
    case "admin.home":
    case "director.home":
      return renderConfigDrivenPage(pageId, context);
    case "shared.profile":
      return apiUserId ? (
        <UserProfilePage viewerUserId={apiUserId} profileUserId={apiUserId} />
      ) : unsupportedStaticPage(pageId);
    case "player.community":
      return apiUserId ? (
        <PlayerCommunityPage nickname={user.nickname} userId={apiUserId} />
      ) : unsupportedStaticPage(pageId);
    case "player.shop":
      return apiUserId ? <PlayerShopPage userId={apiUserId} /> : unsupportedStaticPage(pageId);
    case "player.social":
      return apiUserId ? <PlayerSocialPage userId={apiUserId} /> : unsupportedStaticPage(pageId);
    case "player.preparation":
      return apiUserId ? <PlayerPreparationPage userId={apiUserId} /> : unsupportedStaticPage(pageId);
    case "admin.community":
      return apiUserId ? (
        <AdminCommunityPage nickname={user.nickname} userId={apiUserId} />
      ) : unsupportedStaticPage(pageId);
    case "admin.proposals":
      return apiUserId ? <AdminProposalReviewPage userId={apiUserId} /> : unsupportedStaticPage(pageId);
    case "admin.auditLogs":
      return apiUserId ? <AdminAuditLogsPage userId={apiUserId} /> : unsupportedStaticPage(pageId);
    case "admin.shopManagement":
      return apiUserId ? <AdminShopPage userId={apiUserId} /> : unsupportedStaticPage(pageId);
    case "designer.portfolio":
      return (
        <DesignerPortfolioPage
          onBack={() => onNavigate(DESIGNER_HOME_PATH)}
          onOpenResubmit={(levelId) => onNavigate(`/designer/resubmit/${encodeURIComponent(levelId)}`)}
          onContinueDesign={(levelId) => onNavigate(`${DESIGNER_DESIGN_PATH}?levelId=${encodeURIComponent(levelId)}`)}
        />
      );
    case "designer.birds":
      return apiUserId ? (
        <DesignerBirdLabPage userId={apiUserId} onBack={() => onNavigate("/")} />
      ) : unsupportedStaticPage(pageId);
    case "designer.design":
    case "designer.settings":
    case "designer.designBook":
    case "designer.jsonCheck":
    case "designer.archive":
    case "designer.archiveJsonCheck": {
      const { mode, archiveBackupId } = resolveDesignerLevelEditorMode(pathname);
      const resumeLevelId = pathname === DESIGNER_DESIGN_PATH
        ? new URLSearchParams(search).get("levelId") ?? undefined
        : undefined;
      return (
        <DesignerLevelEditorPage
          {...(apiUserId ? { userId: apiUserId } : {})}
          {...(resumeLevelId ? { resumeLevelId } : {})}
          mode={mode}
          {...(archiveBackupId ? { archiveBackupId } : {})}
          onBack={() => onNavigate(DESIGNER_HOME_PATH)}
          onOpenSettingsPage={() => onNavigate(DESIGNER_SETTINGS_PATH)}
          onExitSettingsPage={() => onNavigate(DESIGNER_DESIGN_PATH)}
          onOpenDesignBook={() => onNavigate(DESIGNER_GUIDE_PATH)}
          onExitDesignBook={() => onNavigate(DESIGNER_DESIGN_PATH)}
          onOpenJsonCheck={() => onNavigate(DESIGNER_JSON_CHECK_PATH)}
          onExitJsonCheck={() => onNavigate(DESIGNER_DESIGN_PATH)}
          onOpenArchive={(nextBackupId) => onNavigate(`${DESIGNER_ARCHIVE_PATH_PREFIX}${nextBackupId}`)}
          onExitArchive={() => onNavigate(DESIGNER_DESIGN_PATH)}
          onOpenArchiveJsonCheck={(nextBackupId) => onNavigate(`${DESIGNER_ARCHIVE_PATH_PREFIX}${nextBackupId}${DESIGNER_ARCHIVE_JSON_CHECK_SUFFIX}`)}
          onExitArchiveJsonCheck={() => (
            archiveBackupId
              ? onNavigate(`${DESIGNER_ARCHIVE_PATH_PREFIX}${archiveBackupId}`)
              : onNavigate(DESIGNER_DESIGN_PATH)
          )}
        />
      );
    }
    case "director.workbench":
      return apiUserId ? (
        <DirectorWorkbenchPage
          userId={apiUserId}
          onOpenUiCustomization={() => onNavigate(DIRECTOR_UI_CUSTOMIZATION_PATH)}
          onOpenLevelInterfaceOptimization={() => onNavigate(DIRECTOR_LEVEL_INTERFACE_PATH)}
          onOpenLevelAssignment={() => onNavigate(DIRECTOR_LEVEL_ASSIGNMENT_PATH)}
          onOpenBirdSkillLab={() => onNavigate(DIRECTOR_BIRD_SKILL_LAB_PATH)}
          onOpenLevelBackgroundTemplates={() => onNavigate(DIRECTOR_LEVEL_BACKGROUND_TEMPLATES_PATH)}
        />
      ) : unsupportedStaticPage(pageId);
    case "director.uiCustomization":
      return <DirectorUiCustomizationPage onNavigate={onNavigate} />;
    case "director.levelInterface":
      return apiUserId ? (
        <DirectorLevelInterfacePage
          userId={apiUserId}
          onBack={() => onNavigate(DIRECTOR_CONSOLE_PATH)}
          onNavigate={onNavigate}
        />
      ) : unsupportedStaticPage(pageId);
    case "director.levelAssignment":
      return apiUserId ? (
        <DirectorLevelAssignmentPage userId={apiUserId} onBack={() => onNavigate(DIRECTOR_CONSOLE_PATH)} />
      ) : unsupportedStaticPage(pageId);
    case "director.birdSkillLab":
      return apiUserId ? (
        <DirectorBirdSkillLabPage userId={apiUserId} onBack={() => onNavigate(DIRECTOR_CONSOLE_PATH)} />
      ) : unsupportedStaticPage(pageId);
    case "director.levelBackgroundTemplates":
      return apiUserId ? (
        <DirectorLevelBackgroundTemplatesPage userId={apiUserId} onBack={() => onNavigate(DIRECTOR_CONSOLE_PATH)} />
      ) : unsupportedStaticPage(pageId);
    case "director.buttonTemplates":
      return apiUserId ? (
        <DirectorButtonTemplatesPage userId={apiUserId} onBack={() => onNavigate(DIRECTOR_UI_CUSTOMIZATION_PATH)} />
      ) : unsupportedStaticPage(pageId);
    default:
      return unsupportedStaticPage(pageId);
  }
};
