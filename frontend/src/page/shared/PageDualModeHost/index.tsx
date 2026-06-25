import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { AuthUser } from "../../../system/app/auth.js";
import {
  getDefaultPageConfig,
  getPageConfig,
  getPageConfigRevision,
  subscribePageConfigStore,
} from "../function/ui-config/ui-customization.js";
import {
  getPublishedPageConfigRevision,
  getRuntimePageConfig,
  subscribePublishedPageConfigs,
} from "../function/ui-config/published-page-configs.js";
import { hydratePublishedPageFromApi } from "../function/ui-config/ui-page-publish.js";
import {
  readPageDisplayModeFromSearch,
  readStoredPageDisplayMode,
  persistPageDisplayMode,
  type PageDisplayMode,
} from "../function/ui-config/page-render-mode.js";
import { PageDisplayModeBar } from "../../../components/page/PageDisplayModeBar.js";
import { DynamicPageHost } from "../DynamicPageHost/index.js";
import { isStaticPageSupported, renderStaticPage, type StaticPageRenderContext } from "../StaticPageRenderer/index.js";

type PageDualModeHostProps = {
  pageId: string;
  user: AuthUser;
  pathname: string;
  search: string;
  onNavigate: (path: string) => void;
  useDefaultConfig?: boolean | undefined;
  showModeBar?: boolean | undefined;
  onOpenSettings?: () => void;
  onUserUpdated?: (user: AuthUser) => void;
  onLogout?: () => void;
  onOpenDesignerDesign?: () => void;
  onOpenDesignerPortfolio?: () => void;
};

const resolveInitialMode = (search: string): PageDisplayMode => {
  const fromSearch = readPageDisplayModeFromSearch(search);
  if (fromSearch) {
    return fromSearch;
  }

  return readStoredPageDisplayMode();
};

export const PageDualModeHost = ({
  pageId,
  user,
  pathname,
  search,
  onNavigate,
  useDefaultConfig = false,
  showModeBar = true,
  onOpenSettings,
  onUserUpdated,
  onLogout,
  onOpenDesignerDesign,
  onOpenDesignerPortfolio,
}: PageDualModeHostProps) => {
  const preferPublishedConfig = user.role === "player" && Boolean(user.apiUserId);
  const pageConfigRevision = useSyncExternalStore(
    subscribePageConfigStore,
    getPageConfigRevision,
    getPageConfigRevision,
  );
  const publishedRevision = useSyncExternalStore(
    subscribePublishedPageConfigs,
    getPublishedPageConfigRevision,
    getPublishedPageConfigRevision,
  );
  const pageConfig = useMemo(() => {
    if (useDefaultConfig) {
      return getDefaultPageConfig(pageId);
    }

    if (preferPublishedConfig) {
      return getRuntimePageConfig(pageId);
    }

    return getPageConfig(pageId);
  }, [pageId, preferPublishedConfig, publishedRevision, useDefaultConfig, pageConfigRevision]);

  useEffect(() => {
    if (!preferPublishedConfig || !user.apiUserId) {
      return;
    }

    void hydratePublishedPageFromApi(user.apiUserId, pageId);
  }, [pageId, preferPublishedConfig, user.apiUserId]);
  const staticAvailable = isStaticPageSupported(pageId);
  const dynamicAvailable = Boolean(pageConfig && pageConfig.components.length > 0);
  const [mode, setMode] = useState<PageDisplayMode>(() => resolveInitialMode(search));

  useEffect(() => {
    const fromSearch = readPageDisplayModeFromSearch(search);
    if (fromSearch) {
      setMode(fromSearch);
    }
  }, [search]);

  useEffect(() => {
    if (mode === "static" && !staticAvailable && dynamicAvailable) {
      setMode("dynamic");
      return;
    }

    if (mode === "dynamic" && !dynamicAvailable && staticAvailable) {
      setMode("static");
      return;
    }

    if (mode === "compare" && (!staticAvailable || !dynamicAvailable)) {
      setMode(staticAvailable ? "static" : "dynamic");
    }
  }, [dynamicAvailable, mode, staticAvailable]);

  const handleModeChange = (nextMode: PageDisplayMode) => {
    setMode(nextMode);
    persistPageDisplayMode(nextMode);
  };

  const staticContext: StaticPageRenderContext = {
    user,
    pathname,
    search,
    onNavigate,
    ...(onOpenSettings ? { onOpenSettings } : {}),
    ...(onUserUpdated ? { onUserUpdated } : {}),
    ...(onLogout ? { onLogout } : {}),
    ...(onOpenDesignerDesign ? { onOpenDesignerDesign } : {}),
    ...(onOpenDesignerPortfolio ? { onOpenDesignerPortfolio } : {}),
  };

  const staticPane = (
    <div className="page-dual-mode-pane page-dual-mode-pane-static">
      <p className="page-dual-mode-pane-label">静态页面</p>
      {renderStaticPage(pageId, staticContext)}
    </div>
  );

  const dynamicPane = (
    <div className="page-dual-mode-pane page-dual-mode-pane-dynamic">
      <p className="page-dual-mode-pane-label">动态嵌套</p>
      <DynamicPageHost
        pageId={pageId}
        useDefaultConfig={useDefaultConfig}
        preferPublishedConfig={preferPublishedConfig}
        runtimeUserId={user.apiUserId ?? undefined}
        onNavigate={onNavigate}
        embedded
        staticContext={staticContext}
      />
    </div>
  );

  return (
    <div className="page-dual-mode-host">
      {showModeBar ? (
        <PageDisplayModeBar
          mode={mode}
          pageId={pageId}
          pageName={pageConfig?.name}
          staticAvailable={staticAvailable}
          dynamicAvailable={dynamicAvailable}
          componentCount={pageConfig?.components.length}
          onModeChange={handleModeChange}
        />
      ) : null}

      {mode === "static" ? staticPane : null}
      {mode === "dynamic" ? dynamicPane : null}
      {mode === "compare" ? (
        <div className="page-dual-mode-compare">
          {staticPane}
          {dynamicPane}
        </div>
      ) : null}
    </div>
  );
};
