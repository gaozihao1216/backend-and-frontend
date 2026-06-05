import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthLandingPage } from "./component/auth/AuthLandingPage.js";
import { BackendBindingPanel } from "./component/BackendBindingPanel.js";
import { RoleHomePage } from "./component/RoleHomePage.js";
import { SettingsPanel } from "./component/SettingsPanel.js";
import { DesignerHomePage } from "./page/DesignerHomePage.js";
import { DesignerPage } from "./page/DesignerPage/index.js";
import { AdminPage } from "./page/AdminPage.js";
import { AdminCommunityPage } from "./page/AdminCommunityPage.js";
import { PlayerCommunityPage } from "./page/PlayerCommunityPage.js";
import { PlayerShopPage } from "./page/PlayerShopPage.js";
import { DirectorButtonDesignPage } from "./page/DirectorButtonDesignPage.js";
import { DirectorButtonTemplatesPage } from "./page/DirectorButtonTemplatesPage.js";
import { DirectorPageBuilderPage } from "./page/DirectorPageBuilderPage.js";
import { DirectorWorkbenchPage } from "./page/DirectorWorkbenchPage.js";
import { DirectorUiCustomizationPage } from "./page/DirectorUiCustomizationPage.js";
import { DynamicPageHost } from "./page/DynamicPageHost.js";
import { UserProfilePage } from "./page/UserProfilePage.js";
import { persistAuthSession, readPersistedAuthUser, type AuthUser } from "./lib/auth.js";

// 当前项目没有引入完整前端路由框架，而是用最小化的 pathname 分流。
// 这样实现足够轻量，也方便把设计器页面与主页逻辑拆开。
const DESIGNER_HOME_PATH = "/designer";
const DESIGNER_DESIGN_PATH = "/designer/design";
const DESIGNER_SETTINGS_PATH = "/designer/design/settings";
const DESIGNER_GUIDE_PATH = "/designer/design/design_book";
const DESIGNER_JSON_CHECK_PATH = "/designer/design/json_check";
const DESIGNER_ARCHIVE_PATH_PREFIX = "/designer/design/archive_";
const DESIGNER_ARCHIVE_JSON_CHECK_SUFFIX = "/json_check";
const OWN_PAGE_PATH = "/own_page";
const COMMUNITY_HALL_PATH = "/community_hall";
const PLAYER_SHOP_PATH = "/player_shop";
const ADMIN_PROPOSALS_PATH = "/admin/proposals";
const DIRECTOR_CONSOLE_PATH = "/director_console";
const DIRECTOR_UI_CUSTOMIZATION_PATH = "/director_console/ui_customization";
const DIRECTOR_BUTTON_TEMPLATES_PATH = "/director_console/ui_customization/button_templates";
const DYNAMIC_PAGE_PATH = "/dynamic_page";
const PAGE_BUILDER_UPDATE_SUFFIX = "/update";
const BUTTON_DESIGN_SUFFIX = "/button_design";

const readPathname = () => window.location.pathname;
const readSearch = () => window.location.search;

export const App = () => {
  // 认证用户会缓存在本地存储里，刷新后尽量恢复会话。
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => readPersistedAuthUser());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pathname, setPathname] = useState(readPathname);
  const [search, setSearch] = useState(readSearch);

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
    // 这里显式跳过重复跳转，避免无意义的 history 记录。
    if (window.location.pathname === nextPath) {
      return;
    }

    window.history.pushState({}, "", nextPath);
    setPathname(readPathname());
    setSearch(readSearch());
  };

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
      const archiveBackupId = pathname.startsWith(DESIGNER_ARCHIVE_PATH_PREFIX)
        ? pathname
            .slice(DESIGNER_ARCHIVE_PATH_PREFIX.length)
            .replace(DESIGNER_ARCHIVE_JSON_CHECK_SUFFIX, "")
        : undefined;
      return (
        <DesignerPage
          // 只有后端已绑定的用户才会携带 apiUserId，这里按需透传。
          {...(user.apiUserId ? { userId: user.apiUserId } : {})}
          mode={
            isArchiveJsonCheckPath
              ? "archive_json_check"
              : pathname === DESIGNER_SETTINGS_PATH
              ? "settings"
              : pathname === DESIGNER_GUIDE_PATH
              ? "design_book"
              : pathname === DESIGNER_JSON_CHECK_PATH
              ? "json_check"
              : pathname.startsWith(DESIGNER_ARCHIVE_PATH_PREFIX)
                ? "archive"
                : "design"
          }
          {...(
            archiveBackupId
              ? { archiveBackupId }
              : {}
          )}
          onBack={() => navigate(DESIGNER_HOME_PATH)}
          onOpenSettingsPage={() => navigate(DESIGNER_SETTINGS_PATH)}
          onExitSettingsPage={() => navigate(DESIGNER_DESIGN_PATH)}
          onOpenDesignBook={() => navigate(DESIGNER_GUIDE_PATH)}
          onExitDesignBook={() => navigate(DESIGNER_DESIGN_PATH)}
          onOpenJsonCheck={() => navigate(DESIGNER_JSON_CHECK_PATH)}
          onExitJsonCheck={() => navigate(DESIGNER_DESIGN_PATH)}
          onOpenArchive={(archiveBackupId) => navigate(`${DESIGNER_ARCHIVE_PATH_PREFIX}${archiveBackupId}`)}
          onExitArchive={() => navigate(DESIGNER_DESIGN_PATH)}
          onOpenArchiveJsonCheck={(archiveBackupId) => navigate(`${DESIGNER_ARCHIVE_PATH_PREFIX}${archiveBackupId}${DESIGNER_ARCHIVE_JSON_CHECK_SUFFIX}`)}
          onExitArchiveJsonCheck={() => archiveBackupId ? navigate(`${DESIGNER_ARCHIVE_PATH_PREFIX}${archiveBackupId}`) : navigate(DESIGNER_DESIGN_PATH)}
        />
      );
    }

    return <DesignerHomePage onOpenDesignWindow={() => navigate(DESIGNER_DESIGN_PATH)} />;
  };

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

  const renderStandaloneRoute = (user: AuthUser) => {
    if (pathname === DYNAMIC_PAGE_PATH) {
      const searchParams = new URLSearchParams(search);
      const pageId = searchParams.get("pageId") ?? "designer.home";
      const useDefaultConfig = searchParams.get("source") === "default";
      return <DynamicPageHost pageId={pageId} useDefaultConfig={useDefaultConfig} onNavigate={navigate} />;
    }

    if (pathname.endsWith(PAGE_BUILDER_UPDATE_SUFFIX) || pathname.endsWith(BUTTON_DESIGN_SUFFIX)) {
      if (user.role !== "admin" || user.adminLevel !== "director") {
        return (
          <section className="panel">
            <h2>页面优化</h2>
            <p className="panel-copy">当前账号不是总监管理员，无法访问页面可视化编辑器。</p>
          </section>
        );
      }

      const pageId = new URLSearchParams(search).get("pageId");
      const searchParams = new URLSearchParams(search);
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

    if (pathname === OWN_PAGE_PATH) {
      return renderBoundPage(user, "个人主页", (apiUserId) => (
        <UserProfilePage viewerUserId={apiUserId} profileUserId={apiUserId} />
      ));
    }

    if (pathname === COMMUNITY_HALL_PATH) {
      if (user.role === "player") {
        return renderBoundPage(user, "社区大厅", (apiUserId) => (
          <PlayerCommunityPage nickname={user.nickname} userId={apiUserId} />
        ));
      }

      if (user.role === "admin") {
        return renderBoundPage(user, "社区管理", (apiUserId) => (
          <AdminCommunityPage nickname={user.nickname} userId={apiUserId} />
        ));
      }

      return (
        <section className="panel">
          <h2>社区大厅</h2>
          <p className="panel-copy">当前身份暂未开放社区管理或社区大厅入口。</p>
        </section>
      );
    }

    if (pathname === PLAYER_SHOP_PATH) {
      if (user.role !== "player") {
        return (
          <section className="panel">
            <h2>玩家商店</h2>
            <p className="panel-copy">当前账号不是玩家，无法访问玩家商店。</p>
          </section>
        );
      }

      return <PlayerShopPage />;
    }

    if (pathname === ADMIN_PROPOSALS_PATH) {
      if (user.role !== "admin") {
        return (
          <section className="panel">
            <h2>提案处理</h2>
            <p className="panel-copy">当前账号不是管理员，无法访问提案处理页面。</p>
          </section>
        );
      }

      return renderBoundPage(user, "提案处理", (apiUserId) => <AdminPage userId={apiUserId} />);
    }

    if (pathname === DIRECTOR_CONSOLE_PATH || pathname === DIRECTOR_UI_CUSTOMIZATION_PATH || pathname === DIRECTOR_BUTTON_TEMPLATES_PATH) {
      if (user.role !== "admin") {
        return (
          <section className="panel">
            <h2>总监控制台</h2>
            <p className="panel-copy">当前账号不是管理员，无法访问总监控制台。</p>
          </section>
        );
      }

      if (pathname === DIRECTOR_UI_CUSTOMIZATION_PATH) {
        return renderBoundPage(user, "UI 美化配置", () => (
          <DirectorUiCustomizationPage onNavigate={navigate} />
        ));
      }

      if (pathname === DIRECTOR_BUTTON_TEMPLATES_PATH) {
        return renderBoundPage(user, "按钮模板", (apiUserId) => (
          <DirectorButtonTemplatesPage
            userId={apiUserId}
            onBack={() => navigate(DIRECTOR_UI_CUSTOMIZATION_PATH)}
          />
        ));
      }

      return renderBoundPage(user, "总监控制台", (apiUserId) => (
        <DirectorWorkbenchPage
          userId={apiUserId}
          onOpenUiCustomization={() => navigate(DIRECTOR_UI_CUSTOMIZATION_PATH)}
        />
      ));
    }

    return null;
  };

  const standaloneRoute = currentUser ? renderStandaloneRoute(currentUser) : null;
  const canReturnToDirectorUiCustomization =
    currentUser?.role === "admin"
    && currentUser.adminLevel === "director"
    && pathname !== DIRECTOR_UI_CUSTOMIZATION_PATH;
  const standaloneTitle =
    pathname.endsWith(PAGE_BUILDER_UPDATE_SUFFIX)
    || pathname.endsWith(BUTTON_DESIGN_SUFFIX)
      ? pathname.endsWith(BUTTON_DESIGN_SUFFIX) ? "按钮美化" : "页面优化"
      : pathname === DYNAMIC_PAGE_PATH
        ? "动态页面"
      : pathname === OWN_PAGE_PATH
      ? "个人主页"
      : pathname === COMMUNITY_HALL_PATH
        ? "社区"
      : pathname === PLAYER_SHOP_PATH
          ? "玩家商店"
          : pathname === ADMIN_PROPOSALS_PATH
            ? "提案处理"
          : pathname === DIRECTOR_CONSOLE_PATH
          || pathname === DIRECTOR_UI_CUSTOMIZATION_PATH
          || pathname === DIRECTOR_BUTTON_TEMPLATES_PATH
            ? pathname === DIRECTOR_BUTTON_TEMPLATES_PATH
              ? "按钮模板"
              : pathname === DIRECTOR_UI_CUSTOMIZATION_PATH ? "UI 美化配置" : "总监控制台"
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
          ) : pathname === DESIGNER_HOME_PATH
          || pathname === DESIGNER_DESIGN_PATH
          || pathname === DESIGNER_SETTINGS_PATH
          || pathname === DESIGNER_GUIDE_PATH
          || pathname === DESIGNER_JSON_CHECK_PATH
          || pathname.startsWith(DESIGNER_ARCHIVE_PATH_PREFIX) ? (
            renderDesignerRoute(currentUser)
          ) : (
            <RoleHomePage
              user={currentUser}
              onOpenSettings={() => setSettingsOpen(true)}
              onUserUpdated={setCurrentUser}
              onOpenDesignerDesign={() => navigate(DESIGNER_DESIGN_PATH)}
              onNavigate={navigate}
            />
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
