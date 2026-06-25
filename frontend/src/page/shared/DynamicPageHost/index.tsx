import { useEffect, useSyncExternalStore } from "react";
import { DynamicPageRenderer } from "../components/ui-renderer/index.js";
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
import { getUiPreviewUser } from "../../../objects/ui-customization/ui-customization-objects.js";
import { isStaticPageSupported, renderStaticPage, type StaticPageRenderContext } from "../StaticPageRenderer/index.js";

type DynamicPageHostProps = {
  pageId: string | null;
  useDefaultConfig?: boolean | undefined;
  preferPublishedConfig?: boolean | undefined;
  runtimeUserId?: string | undefined;
  onNavigate: (path: string) => void;
  embedded?: boolean | undefined;
  staticContext?: StaticPageRenderContext | undefined;
};

export const DynamicPageHost = ({
  pageId,
  useDefaultConfig = false,
  preferPublishedConfig = false,
  runtimeUserId,
  onNavigate,
  embedded = false,
  staticContext,
}: DynamicPageHostProps) => {
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
  const pageConfig = pageId
    ? (useDefaultConfig
      ? getDefaultPageConfig(pageId)
      : preferPublishedConfig
        ? getRuntimePageConfig(pageId)
        : getPageConfig(pageId))
    : null;
  void pageConfigRevision;
  void publishedRevision;

  useEffect(() => {
    if (!preferPublishedConfig || !runtimeUserId || !pageId) {
      return;
    }

    void hydratePublishedPageFromApi(runtimeUserId, pageId);
  }, [pageId, preferPublishedConfig, runtimeUserId]);
  const previewUser = pageConfig ? getUiPreviewUser(pageConfig.roleScope) : null;

  if (!pageId) {
    return (
      <section className="panel dynamic-page-host">
        <h2>动态页面渲染</h2>
        <p className="feedback error">缺少 pageId，无法渲染动态页面。</p>
      </section>
    );
  }

  if (!pageConfig) {
    return (
      <section className={`panel dynamic-page-host ${embedded ? "embedded" : ""}`.trim()}>
        <h2>动态页面渲染</h2>
        <p className="feedback error">未找到动态页面配置：{pageId}</p>
      </section>
    );
  }

  const shouldRenderStaticEmbed =
    pageConfig.surfaceMode === "staticEmbed"
    || (pageConfig.components.length === 0 && staticContext && isStaticPageSupported(pageId));

  if (shouldRenderStaticEmbed) {
    if (!staticContext || !isStaticPageSupported(pageId)) {
      return (
        <section className={`panel dynamic-page-host ${embedded ? "embedded" : ""}`.trim()}>
          <h2>动态页面渲染</h2>
          <p className="feedback error">该页面配置为静态嵌入模式，但当前缺少静态页面上下文：{pageId}</p>
        </section>
      );
    }

    const staticEmbed = (
      <div className="dynamic-ui-page dynamic-ui-page-static-embed">
        {renderStaticPage(pageId, staticContext)}
      </div>
    );

    if (embedded) {
      return staticEmbed;
    }

    return (
      <section className="panel dynamic-page-host">
        <div className="feature-header dynamic-page-host-header">
          <div>
            <p className="eyebrow">Dynamic Page</p>
            <h2>{pageConfig.name}</h2>
            <p className="panel-copy">
              该页面使用静态嵌入模式，直接渲染真实 React 页面，不再额外包裹演示用 Panel 壳层。
            </p>
          </div>
          <div className="dynamic-page-host-meta">
            <span>{pageConfig.id}</span>
            <code>{pageConfig.path}</code>
          </div>
        </div>
        {staticEmbed}
      </section>
    );
  }

  if (pageConfig.components.length === 0) {
    return (
      <section className={`panel dynamic-page-host ${embedded ? "embedded" : ""}`.trim()}>
        <h2>动态页面渲染</h2>
        <p className="feedback error">该页面配置没有组件，无法验证嵌套渲染：{pageId}</p>
      </section>
    );
  }

  const canvas = (
    <div className={`dynamic-page-host-canvas${embedded ? " is-embedded" : ""}`.trim()}>
      <DynamicPageRenderer
        page={pageConfig}
        previewUser={previewUser ?? undefined}
        runtimeUserId={runtimeUserId}
        onNavigate={onNavigate}
        {...(staticContext?.onOpenSettings ? { onOpenSettings: staticContext.onOpenSettings } : {})}
        {...(staticContext?.onLogout ? { onLogout: staticContext.onLogout } : {})}
      />
    </div>
  );

  if (embedded) {
    return canvas;
  }

  return (
    <section className="panel dynamic-page-host">
      <div className="feature-header dynamic-page-host-header">
        <div>
          <p className="eyebrow">Dynamic Page</p>
          <h2>{pageConfig.name}</h2>
          <p className="panel-copy">
            该页面完全由 PageConfig 中的 Panel、Text、Button 嵌套数据渲染。
            {useDefaultConfig ? " 当前使用代码默认配置，未读取浏览器覆盖配置。" : ""}
          </p>
        </div>
        <div className="dynamic-page-host-meta">
          <span>{pageConfig.id}</span>
          <code>{pageConfig.path}</code>
        </div>
      </div>
      {canvas}
    </section>
  );
};
