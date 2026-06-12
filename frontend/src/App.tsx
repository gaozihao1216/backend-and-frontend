import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthLandingPage } from "./component/auth/AuthLandingPage.js";
import { BackendBindingPanel } from "./component/BackendBindingPanel.js";
import { SettingsPanel } from "./component/SettingsPanel.js";
import { DesignerResubmitPage } from "./page/designer/DesignerResubmitPage.js";
import { DirectorButtonDesignPage } from "./page/director/DirectorButtonDesignPage/index.js";
import { DirectorButtonConfigPage } from "./page/director/DirectorButtonConfigPage.js";
import { DirectorPanelCreatePage } from "./page/director/DirectorPanelCreatePage/index.js";
import { DirectorPageBuilderPage } from "./page/director/DirectorPageBuilderPage/index.js";
import { PageDualModeHost } from "./page/shared/PageDualModeHost.js";
import { persistAuthSession, readPersistedAuthUser, type AuthUser } from "./lib/auth.js";
import { compactStoredPageConfigVisualAssets, compactStoredRoleHomePageConfigs } from "./lib/ui-customization.js";
import { hydrateSharedLevelMapFromApi } from "./lib/shared-level-map-persistence.js";
import { isPageBuilderPath, resolveHomePageId, resolvePageId } from "./lib/page-id-resolver.js";
import { checkRouteAccess } from "./lib/route-access.js";

// 当前项目没有引入完整前端路由框架，而是用最小化的 pathname 分流。
// 这样实现足够轻量，也方便把设计器页面与主页逻辑拆开。
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
const LEVEL_SCREEN_PATH_PREFIX = "/levels/";
const DIRECTOR_BUTTON_TEMPLATES_PATH = "/director_console/ui_customization/button_templates";
const DYNAMIC_PAGE_PATH = "/dynamic_page";
const PAGE_BUILDER_UPDATE_SUFFIX = "/update";
const BUTTON_DESIGN_SUFFIX = "/button_design";
const BUTTON_CONFIG_SUFFIX = "/button_config";
const PANEL_CREATE_SUFFIX = "/panel_create";

const readPathname = () => window.location.pathname;
const readSearch = () => window.location.search;

export const App = () => {
  // 认证用户会缓存在本地存储里，刷新后尽量恢复会话。
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => readPersistedAuthUser());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pathname, setPathname] = useState(readPathname);
  const [search, setSearch] = useState(readSearch);

  useEffect(() => {
    void compactStoredPageConfigVisualAssets();
    compactStoredRoleHomePageConfigs();
  }, []);

  useEffect(() => {
    if (!currentUser?.apiUserId) {
      return;
    }

    void hydrateSharedLevelMapFromApi(currentUser.apiUserId);
  }, [currentUser?.apiUserId]);

  useEffect(() => {
    // 每次用户变化后立即持久化，避免刷新丢失当前登录角色。
    persistAuthSession(currentUser);
  }, [currentUser]);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(readPathname());
      setSearch(readSearch());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath: string) => {
    const nextUrl = new URL(nextPath, window.location.origin);
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const targetPath = `${nextUrl.pathname}${nextUrl.search}`;
    // 这里显式跳过重复跳转，避免无意义的 history 记录。
    if (currentPath === targetPath) {
      return;
    }

    window.history.pushState({}, "", targetPath);
    setPathname(readPathname());
    setSearch(readSearch());
  };

  const renderDualModePage = (
    user: AuthUser,
    pageId: string,
    options?: {
      useDefaultConfig?: boolean;
      onOpenSettings?: () => void;
      onUserUpdated?: (nextUser: AuthUser) => void;
      onOpenDesignerDesign?: () => void;
      onOpenDesignerPortfolio?: () => void;
    },
  ) => (
    <PageDualModeHost
      pageId={pageId}
      user={user}
      pathname={pathname}
      search={search}
      onNavigate={navigate}
      onOpenSettings={() => setSettingsOpen(true)}
      onLogout={() => {
        setSettingsOpen(false);
        setCurrentUser(null);
      }}
      onUserUpdated={setCurrentUser}
      onOpenDesignerDesign={() => navigate(DESIGNER_DESIGN_PATH)}
      onOpenDesignerPortfolio={() => navigate(DESIGNER_PORTFOLIO_PATH)}
      {...(options?.useDefaultConfig ? { useDefaultConfig: true } : {})}
    />
  );

  const renderDesignerRoute = (user: AuthUser) => {
    // 即便用户强行访问设计器路径，也要再次校验角色，避免前端越权显示。
    if (user.role !== "designer") {
      return (
        <section className="panel">
          <h2>Designer</h2>
          <p className="panel-copy">当前账号不是设计师，无法访问设计师页面。</p>
        </section>
      );
    }

    if (pathname === DESIGNER_PORTFOLIO_PATH) {
      return renderDualModePage(user, "designer.portfolio");
    }

    if (pathname === DESIGNER_BIRDS_PATH) {
      if (!user.apiUserId) {
        return (
          <BackendBindingPanel title="鸟类开发" user={user} onBound={setCurrentUser} />
        );
      }

      return renderDualModePage(user, "designer.birds");
    }

    if (pathname.startsWith(DESIGNER_RESUBMIT_PATH_PREFIX)) {
      const levelId = decodeURIComponent(pathname.slice(DESIGNER_RESUBMIT_PATH_PREFIX.length));
      return (
        <DesignerResubmitPage
          levelId={levelId}
          onBack={() => navigate(DESIGNER_PORTFOLIO_PATH)}
        />
      );
    }

    if (
      pathname === DESIGNER_DESIGN_PATH
      || pathname === DESIGNER_SETTINGS_PATH
      || pathname === DESIGNER_GUIDE_PATH
      || pathname === DESIGNER_JSON_CHECK_PATH
      || pathname.startsWith(DESIGNER_ARCHIVE_PATH_PREFIX)
    ) {
      const pageId = resolvePageId(pathname, user, search);
      if (pageId) {
        return renderDualModePage(user, pageId);
      }
    }

    return renderDualModePage(user, "designer.home");
  };

  const isDesignerAppPath =
    pathname === DESIGNER_HOME_PATH
    || pathname === DESIGNER_PORTFOLIO_PATH
    || pathname === DESIGNER_BIRDS_PATH
    || pathname.startsWith(DESIGNER_RESUBMIT_PATH_PREFIX)
    || pathname === DESIGNER_DESIGN_PATH
    || pathname === DESIGNER_SETTINGS_PATH
    || pathname === DESIGNER_GUIDE_PATH
    || pathname === DESIGNER_JSON_CHECK_PATH
    || pathname.startsWith(DESIGNER_ARCHIVE_PATH_PREFIX);

  const isDesignerWorkspacePath =
    pathname === DESIGNER_DESIGN_PATH
    || pathname === DESIGNER_SETTINGS_PATH
    || pathname === DESIGNER_GUIDE_PATH
    || pathname === DESIGNER_JSON_CHECK_PATH;
    // archive 页面沿用同一套设计器工作区壳子
  const isArchiveWorkspacePath = pathname.startsWith(DESIGNER_ARCHIVE_PATH_PREFIX);

  const renderBoundPage = (
    user: AuthUser,
    title: string,
    renderPage: (apiUserId: string) => ReactNode,
  ) =>
    user.apiUserId ? (
      renderPage(user.apiUserId)
    ) : (
      <BackendBindingPanel title={title} user={user} onBound={setCurrentUser} />
    );

  const renderAccessDenied = (title: string, message: string) => (
    <section className="panel">
      <h2>{title}</h2>
      <p className="panel-copy">{message}</p>
    </section>
  );

  const renderStandaloneRoute = (user: AuthUser) => {
    const routeDenial = checkRouteAccess(pathname, user);
    if (routeDenial) {
      return renderAccessDenied(routeDenial.title, routeDenial.message);
    }

    if (isPageBuilderPath(pathname)) {
      const searchParams = new URLSearchParams(search);
      const pageId = searchParams.get("pageId");
      if (pathname.endsWith(PANEL_CREATE_SUFFIX)) {
        const targetPath = pathname.slice(0, -PANEL_CREATE_SUFFIX.length) || "/";
        return renderBoundPage(user, "创建小面板", (apiUserId) => (
          <DirectorPanelCreatePage
            userId={apiUserId}
            pageId={pageId}
            targetPath={targetPath}
            parentPanelId={searchParams.get("parentPanelId")}
            onBack={() => navigate(`${targetPath === "/" ? "" : targetPath}${PAGE_BUILDER_UPDATE_SUFFIX}?pageId=${encodeURIComponent(pageId ?? "")}`)}
            onNavigate={navigate}
          />
        ));
      }

      if (pathname.endsWith(BUTTON_CONFIG_SUFFIX)) {
        const targetPath = pathname.slice(0, -BUTTON_CONFIG_SUFFIX.length) || "/";
        return renderBoundPage(user, "按钮配置", () => (
          <DirectorButtonConfigPage
            pageId={pageId}
            componentId={searchParams.get("componentId")}
            onBack={() => navigate(`${targetPath}${PAGE_BUILDER_UPDATE_SUFFIX}?pageId=${encodeURIComponent(pageId ?? "")}`)}
          />
        ));
      }

      if (pathname.endsWith(BUTTON_DESIGN_SUFFIX)) {
        const targetPath = pathname.slice(0, -BUTTON_DESIGN_SUFFIX.length) || "/";
        return renderBoundPage(user, "按钮美化", (apiUserId) => (
          <DirectorButtonDesignPage
            userId={apiUserId}
            pageId={pageId}
            componentId={searchParams.get("componentId")}
            onBack={() => navigate(`${targetPath}${PAGE_BUILDER_UPDATE_SUFFIX}?pageId=${encodeURIComponent(pageId ?? "")}`)}
          />
        ));
      }

      const targetPath = pathname.slice(0, -PAGE_BUILDER_UPDATE_SUFFIX.length) || "/";
      return (
        <DirectorPageBuilderPage
          pageId={pageId}
          targetPath={targetPath}
          onBack={() => navigate(DIRECTOR_UI_CUSTOMIZATION_PATH)}
          onNavigate={navigate}
        />
      );
    }

    if (pathname === DYNAMIC_PAGE_PATH) {
      const searchParams = new URLSearchParams(search);
      const pageId = searchParams.get("pageId") ?? "designer.home";
      const useDefaultConfig = searchParams.get("source") === "default";
      return renderDualModePage(user, pageId, { useDefaultConfig });
    }

    const pageId = resolvePageId(pathname, user, search);
    if (!pageId) {
      return null;
    }

    if (pathname === COMMUNITY_HALL_PATH && user.role !== "player" && user.role !== "admin") {
      return (
        <section className="panel">
          <h2>社区大厅</h2>
          <p className="panel-copy">当前身份暂未开放社区管理或社区大厅入口。</p>
        </section>
      );
    }

    if (pathname === PLAYER_SHOP_PATH && user.role !== "player") {
      return (
        <section className="panel">
          <h2>玩家商店</h2>
          <p className="panel-copy">当前账号不是玩家，无法访问玩家商店。</p>
        </section>
      );
    }

    if (pathname === PLAYER_SOCIAL_PATH && user.role !== "player") {
      return (
        <section className="panel">
          <h2>好友与私聊</h2>
          <p className="panel-copy">当前账号不是玩家，无法访问好友系统。</p>
        </section>
      );
    }

    if (pathname === PLAYER_PREPARATION_PATH && user.role !== "player") {
      return (
        <section className="panel">
          <h2>备战区域</h2>
          <p className="panel-copy">当前账号不是玩家，无法访问备战区域。</p>
        </section>
      );
    }

    const bindingTitles: Record<string, string> = {
      "shared.profile": "个人主页",
      "player.community": "社区大厅",
      "player.shop": "玩家商店",
      "player.social": "好友与私聊",
      "player.preparation": "备战区域",
      "admin.community": "社区管理",
      "admin.proposals": "提案处理",
      "designer.birds": "鸟类开发",
      "director.workbench": "总监控制台",
      "director.levelInterface": "关卡界面优化",
      "director.levelAssignment": "关卡细节分配",
      "director.birdSkillLab": "鸟类技能实验室",
      "director.levelBackgroundTemplates": "关卡背景模板",
      "director.buttonTemplates": "模板库",
    };

    const bindingTitle = bindingTitles[pageId];
    if (bindingTitle && !user.apiUserId) {
      return <BackendBindingPanel title={bindingTitle} user={user} onBound={setCurrentUser} />;
    }

    return renderDualModePage(user, pageId);
  };

  const standaloneRoute = currentUser ? renderStandaloneRoute(currentUser) : null;
  const canReturnToDirectorUiCustomization =
    currentUser?.role === "admin"
    && currentUser.adminLevel === "director"
    && pathname !== DIRECTOR_UI_CUSTOMIZATION_PATH;
  const standaloneTitle =
    pathname.endsWith(PAGE_BUILDER_UPDATE_SUFFIX)
    || pathname.endsWith(BUTTON_DESIGN_SUFFIX)
    || pathname.endsWith(BUTTON_CONFIG_SUFFIX)
    || pathname.endsWith(PANEL_CREATE_SUFFIX)
      ? pathname.endsWith(BUTTON_CONFIG_SUFFIX)
        ? "按钮配置"
        : pathname.endsWith(BUTTON_DESIGN_SUFFIX)
          ? "按钮美化"
          : pathname.endsWith(PANEL_CREATE_SUFFIX) ? "创建小面板" : "页面优化"
      : pathname.startsWith(LEVEL_SCREEN_PATH_PREFIX)
        ? "关卡界面"
      : pathname === DYNAMIC_PAGE_PATH
        ? "动态页面"
      : pathname === OWN_PAGE_PATH
      ? "个人主页"
      : pathname === COMMUNITY_HALL_PATH
        ? "社区"
      : pathname === PLAYER_SHOP_PATH
          ? "玩家商店"
          : pathname === PLAYER_SOCIAL_PATH
            ? "好友与私聊"
            : pathname === PLAYER_PREPARATION_PATH
              ? "备战区域"
          : pathname === ADMIN_PROPOSALS_PATH
            ? "提案处理"
          : pathname === DIRECTOR_CONSOLE_PATH
          || pathname === DIRECTOR_UI_CUSTOMIZATION_PATH
          || pathname === DIRECTOR_BUTTON_TEMPLATES_PATH
          || pathname === DIRECTOR_LEVEL_INTERFACE_PATH
          || pathname === DIRECTOR_LEVEL_ASSIGNMENT_PATH
          || pathname === DIRECTOR_BIRD_SKILL_LAB_PATH
          || pathname === DIRECTOR_LEVEL_BACKGROUND_TEMPLATES_PATH
            ? pathname === DIRECTOR_BUTTON_TEMPLATES_PATH
              ? "模板库"
              : pathname === DIRECTOR_UI_CUSTOMIZATION_PATH
                ? "UI 美化配置"
                : pathname === DIRECTOR_LEVEL_INTERFACE_PATH
                  ? "关卡界面优化"
                  : pathname === DIRECTOR_LEVEL_ASSIGNMENT_PATH
                    ? "关卡细节分配"
                    : pathname === DIRECTOR_BIRD_SKILL_LAB_PATH
                      ? "鸟类技能实验室"
                    : pathname === DIRECTOR_LEVEL_BACKGROUND_TEMPLATES_PATH
                      ? "关卡背景模板"
                  : "总监控制台"
          : "";

  return (
    <main className={`app-shell ${isDesignerWorkspacePath || isArchiveWorkspacePath ? "designer-app-shell" : ""}`}>
      {currentUser ? (
        <>
          {canReturnToDirectorUiCustomization ? (
            <div className="director-return-bar">
              <button type="button" className="secondary" onClick={() => navigate(DIRECTOR_UI_CUSTOMIZATION_PATH)}>
                返回原界面
              </button>
            </div>
          ) : null}
          {standaloneRoute ? (
            <>
              <div className="dashboard-topbar">
                <div>
                  <p className="eyebrow">Workspace</p>
                  <h1>{standaloneTitle}</h1>
                </div>
                <div className="top-right-actions">
                  <button type="button" className="secondary" onClick={() => navigate("/")}>
                    返回主界面
                  </button>
                  <button type="button" className="secondary" onClick={() => setSettingsOpen(true)}>
                    设置
                  </button>
                </div>
              </div>
              {standaloneRoute}
            </>
          ) : isDesignerAppPath ? (
            renderDesignerRoute(currentUser)
          ) : (
            renderDualModePage(currentUser, resolveHomePageId(currentUser))
          )}
          <SettingsPanel
            user={currentUser}
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onLogout={() => {
              setSettingsOpen(false);
              setCurrentUser(null);
            }}
          />
        </>
      ) : (
        <AuthLandingPage onAuthenticated={setCurrentUser} />
      )}
    </main>
  );
};
