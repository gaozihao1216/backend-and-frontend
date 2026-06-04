import { DynamicPageRenderer } from "../component/ui-renderer/index.js";
import { getDefaultPageConfig, getPageConfig } from "../lib/ui-customization.js";
import { getUiPreviewUser } from "../objects/ui-customization/ui-customization-objects.js";

type DynamicPageHostProps = {
  pageId: string | null;
  useDefaultConfig?: boolean | undefined;
  onNavigate: (path: string) => void;
};

export const DynamicPageHost = ({ pageId, useDefaultConfig = false, onNavigate }: DynamicPageHostProps) => {
  const pageConfig = pageId ? (useDefaultConfig ? getDefaultPageConfig(pageId) : getPageConfig(pageId)) : null;
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
      <section className="panel dynamic-page-host">
        <h2>动态页面渲染</h2>
        <p className="feedback error">未找到动态页面配置：{pageId}</p>
      </section>
    );
  }

  if (pageConfig.components.length === 0) {
    return (
      <section className="panel dynamic-page-host">
        <h2>动态页面渲染</h2>
        <p className="feedback error">该页面配置没有组件，无法验证嵌套渲染：{pageId}</p>
      </section>
    );
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

      <div className="dynamic-page-host-canvas">
        <DynamicPageRenderer
          page={pageConfig}
          previewUser={previewUser ?? undefined}
          onNavigate={onNavigate}
        />
      </div>
    </section>
  );
};
