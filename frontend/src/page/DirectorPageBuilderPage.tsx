import { UiActualPagePreview } from "./UiActualPagePreview.js";
import { getPageConfig } from "../lib/ui-customization.js";
import {
  getUiPreviewUser,
} from "../objects/ui-customization/ui-customization-objects.js";

type DirectorPageBuilderPageProps = {
  pageId: string | null;
  targetPath: string;
  onBack: () => void;
};

export const DirectorPageBuilderPage = ({ pageId, targetPath, onBack }: DirectorPageBuilderPageProps) => {
  const pageConfig = pageId ? getPageConfig(pageId) : null;
  const previewUser = pageConfig ? getUiPreviewUser(pageConfig.roleScope) : null;

  return (
    <section className="page-builder-shell">
      <div className="page-builder-toolbar">
        <div>
          <p className="eyebrow">Page Builder</p>
          <h2>页面可视化编辑器</h2>
          <p className="panel-copy">当前画布直接渲染目标测试账号打开该路由时看到的真实页面。</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={onBack}>
            返回 UI 美化配置
          </button>
          <button type="button" disabled={!pageConfig}>
            保存配置
          </button>
        </div>
      </div>

      {!pageId ? (
        <p className="feedback error">缺少 pageId，无法进入页面优化。</p>
      ) : null}
      {pageId && !pageConfig ? (
        <p className="feedback error">该页面还没有动态页面配置，无法优化。</p>
      ) : null}

      {pageConfig ? (
        <div className="page-builder-layout">
          <div className="page-builder-preview-meta">
            <div>
              <span>预览页面</span>
              <strong>{pageConfig.name}</strong>
              <code>{pageConfig.path}</code>
            </div>
            {previewUser ? (
              <div>
                <span>测试账号</span>
                <strong>{previewUser.nickname}</strong>
                <code>
                  {previewUser.roleLabel} · {previewUser.apiUserId}
                </code>
              </div>
            ) : null}
          </div>
          <section className="page-builder-canvas-panel">
            <div className="page-builder-canvas">
              <div className="page-builder-nested-page">
                <div className="page-builder-render-surface page-builder-actual-preview-surface">
                  {previewUser ? (
                    <div className="page-builder-actual-page-frame">
                      <UiActualPagePreview page={pageConfig} previewUser={previewUser} />
                    </div>
                  ) : null}
                </div>
                <div className="page-builder-preview-note">
                  <span>静态回退路径：{targetPath}</span>
                  <span>真实页面预览已禁用交互，避免误修改测试数据。</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
};
