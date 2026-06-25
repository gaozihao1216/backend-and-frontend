import { LevelBackgroundPreview } from "./components/LevelBackgroundPreview.js";
import { LevelBackgroundTemplateEditor } from "./components/LevelBackgroundTemplateEditor.js";
import {
  LEVEL_BACKGROUND_WEATHER_META,
  type LevelBackgroundWeather,
} from "../../../objects/level/level-background-template.js";
import { useDirectorLevelBackgroundTemplatesPage } from "./hooks/useDirectorLevelBackgroundTemplatesPage.js";
import type { DirectorLevelBackgroundTemplatesPageProps } from "./objects/director-level-background-templates-page-types.js";

const weatherLabel = (weather: LevelBackgroundWeather) =>
  LEVEL_BACKGROUND_WEATHER_META.find((entry) => entry.id === weather)?.label ?? weather;

export const DirectorLevelBackgroundTemplatesPage = ({ userId, onBack }: DirectorLevelBackgroundTemplatesPageProps) => {
  const vm = useDirectorLevelBackgroundTemplatesPage(userId);

  return (
    <section className="panel director-level-background-page">
      <div className="feature-header">
        <div>
          <h2>关卡背景模板</h2>
          <p className="panel-copy">
            背景主图层套用面板模板，云朵使用多个图案模板组合渲染。支持晴天漂移云朵、雨天雨滴与雷雨天闪电等动态效果。
          </p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={onBack}>
            返回工作台
          </button>
        </div>
      </div>

      {vm.error ? <p className="feedback error">{vm.error}</p> : null}
      {vm.message ? <p className="feedback success">{vm.message}</p> : null}

      <div className="director-level-background-layout">
        <section className="feature-card director-level-background-list">
          <div className="card-header">
            <strong>模板列表</strong>
            <span>{vm.templates.length} 个</span>
          </div>

          <div className="level-background-create-actions">
            {LEVEL_BACKGROUND_WEATHER_META.map((weather) => (
              <button
                key={weather.id}
                type="button"
                className="secondary"
                onClick={() => vm.handleCreateTemplate(weather.id)}
              >
                新建{weather.label}
              </button>
            ))}
          </div>

          <div className="director-level-background-template-list">
            {vm.templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={`director-level-background-template-item${vm.selectedTemplate?.id === template.id ? " active" : ""}`}
                onClick={() => vm.selectTemplate(template)}
              >
                <strong>{template.name}</strong>
                <span>{weatherLabel(template.weather)}</span>
                <span className="meta">{template.id}</span>
              </button>
            ))}
          </div>

          <div className="actions">
            <button type="button" className="secondary" onClick={vm.handleResetDefaults}>
              恢复默认模板
            </button>
          </div>
        </section>

        <section className="feature-card director-level-background-editor">
          {vm.draft ? (
            <>
              <div className="card-header">
                <strong>模板编辑</strong>
                <span>{vm.draft.id}</span>
              </div>

              <LevelBackgroundTemplateEditor userId={userId} draft={vm.draft} onChange={vm.setDraft} />

              <div className="actions">
                <button type="button" onClick={vm.handleSave}>
                  保存模板
                </button>
                <button type="button" className="secondary" onClick={vm.handleDelete}>
                  删除模板
                </button>
              </div>

              <div className="director-level-background-preview-shell">
                <div className="card-header">
                  <strong>动态预览</strong>
                  <span>
                    {weatherLabel(vm.draft.weather)}
                    {vm.resolvedPanelDesign ? " · 面板模板" : " · 渐变色"}
                    {vm.resolvedCloudDesigns.length > 0 ? ` · ${vm.resolvedCloudDesigns.length} 种云朵` : " · 默认云朵"}
                  </span>
                </div>
                <LevelBackgroundPreview
                  template={vm.draft}
                  panelBackgroundDesign={vm.resolvedPanelDesign}
                  cloudPatternDesigns={vm.resolvedCloudDesigns}
                />
              </div>
            </>
          ) : (
            <p className="meta">请选择或创建一个背景模板。</p>
          )}
        </section>
      </div>
    </section>
  );
};
