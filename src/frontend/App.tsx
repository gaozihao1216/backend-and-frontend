import { useEffect, useState } from "react";
import { AuthLandingPage } from "./components/auth/AuthLandingPage.js";
import { BackendBindingPanel } from "./components/BackendBindingPanel.js";
import { RoleHomePage } from "./components/RoleHomePage.js";
import { SettingsPanel } from "./components/SettingsPanel.js";
import { DesignerHomePage } from "./pages/DesignerHomePage.js";
import { DesignerPage } from "./pages/DesignerPage.js";
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

const readPathname = () => window.location.pathname;

export const App = () => {
  // 认证用户会缓存在本地存储里，刷新后尽量恢复会话。
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => readPersistedAuthUser());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pathname, setPathname] = useState(readPathname);

  useEffect(() => {
    // 每次用户变化后立即持久化，避免刷新丢失当前登录角色。
    persistAuthSession(currentUser);
  }, [currentUser]);

  useEffect(() => {
    const handlePopState = () => setPathname(readPathname());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath: string) => {
    // 这里显式跳过重复跳转，避免无意义的 history 记录。
    if (window.location.pathname === nextPath) {
      return;
    }

    window.history.pushState({}, "", nextPath);
    setPathname(nextPath);
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

  return (
    <main className={`app-shell ${isDesignerWorkspacePath || isArchiveWorkspacePath ? "designer-app-shell" : ""}`}>
      {currentUser ? (
        <>
          {pathname === DESIGNER_HOME_PATH
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
