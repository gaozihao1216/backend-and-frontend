import { useMemo, useState } from "react";
import { LevelBackgroundPreview } from "../../component/director/LevelBackgroundPreview.js";
import { LevelBackgroundTemplateEditor } from "../../component/director/LevelBackgroundTemplateEditor.js";
import { useDirectorTemplateLibrary } from "../../hook/useDirectorTemplateLibrary.js";
import {
  createLevelBackgroundTemplateDraft,
  deleteLevelBackgroundTemplate,
  listLevelBackgroundTemplates,
  resetLevelBackgroundTemplates,
  upsertLevelBackgroundTemplate,
} from "../../lib/level-background-template-store.js";
import {
  resolveLevelBackgroundCloudDesigns,
  resolveLevelBackgroundPanelDesign,
} from "../../lib/level-background-template-render.js";
import {
  LEVEL_BACKGROUND_WEATHER_META,
  type LevelBackgroundTemplate,
  type LevelBackgroundWeather,
} from "../../objects/level/level-background-template.js";

type DirectorLevelBackgroundTemplatesPageProps = {
  userId: string;
  onBack: () => void;
};

const weatherLabel = (weather: LevelBackgroundWeather) =>
  LEVEL_BACKGROUND_WEATHER_META.find((entry) => entry.id === weather)?.label ?? weather;

export const DirectorLevelBackgroundTemplatesPage = ({ userId, onBack }: DirectorLevelBackgroundTemplatesPageProps) => {
  const { panelTemplates, patternTemplates } = useDirectorTemplateLibrary(userId);
  const panelTemplateMap = useMemo(
    () => new Map(panelTemplates.map((template) => [template.id, template])),
    [panelTemplates],
  );
  const patternTemplateMap = useMemo(
    () => new Map(patternTemplates.map((template) => [template.id, template])),
    [patternTemplates],
  );

  const [templates, setTemplates] = useState<LevelBackgroundTemplate[]>(() => listLevelBackgroundTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => templates[0]?.id ?? "");
  const [draft, setDraft] = useState<LevelBackgroundTemplate | null>(() =>
    templates.find((template) => template.id === selectedTemplateId) ?? templates[0] ?? null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const resolvedPanelDesign = useMemo(
    () => (draft ? resolveLevelBackgroundPanelDesign(draft, panelTemplateMap) : null),
    [draft, panelTemplateMap],
  );
  const resolvedCloudDesigns = useMemo(
    () => (draft ? resolveLevelBackgroundCloudDesigns(draft, patternTemplateMap) : []),
    [draft, patternTemplateMap],
  );

  const selectTemplate = (template: LevelBackgroundTemplate) => {
    setSelectedTemplateId(template.id);
    setDraft({ ...template });
    setMessage("");
    setError("");
  };

  const handleCreateTemplate = (weather: LevelBackgroundWeather) => {
    const nextDraft = createLevelBackgroundTemplateDraft(weather);
    setTemplates((current) => [...current, nextDraft]);
    selectTemplate(nextDraft);
    setMessage(`已创建${weatherLabel(weather)}模板，编辑后请保存。`);
  };

  const handleSave = () => {
    if (!draft) {
      return;
    }

    setError("");
    setMessage("");

    void upsertLevelBackgroundTemplate(draft)
      .then((saved) => {
        setTemplates(saved);
        const savedTemplate = saved.find((template) => template.id === draft.id) ?? draft;
        setDraft(savedTemplate);
        setMessage("背景模板已保存。");
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "保存背景模板失败");
      });
  };

  const handleDelete = () => {
    if (!draft) {
      return;
    }

    const confirmed = window.confirm(`确定删除模板「${draft.name}」吗？`);
    if (!confirmed) {
      return;
    }

    const saved = deleteLevelBackgroundTemplate(draft.id);
    setTemplates(saved);
    const nextTemplate = saved[0] ?? null;
    setSelectedTemplateId(nextTemplate?.id ?? "");
    setDraft(nextTemplate ? { ...nextTemplate } : null);
    setMessage("模板已删除。");
    setError("");
  };

  const handleResetDefaults = () => {
    const confirmed = window.confirm("确定恢复默认的晴天、雨天、雷雨天模板吗？自定义模板将被覆盖。");
    if (!confirmed) {
      return;
    }

    const saved = resetLevelBackgroundTemplates();
    setTemplates(saved);
    const nextTemplate = saved[0] ?? null;
    setSelectedTemplateId(nextTemplate?.id ?? "");
    setDraft(nextTemplate ? { ...nextTemplate } : null);
    setMessage("已恢复默认模板。");
    setError("");
  };

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

      {error ? <p className="feedback error">{error}</p> : null}
      {message ? <p className="feedback success">{message}</p> : null}

      <div className="director-level-background-layout">
        <section className="feature-card director-level-background-list">
          <div className="card-header">
            <strong>模板列表</strong>
            <span>{templates.length} 个</span>
          </div>

          <div className="level-background-create-actions">
            {LEVEL_BACKGROUND_WEATHER_META.map((weather) => (
              <button
                key={weather.id}
                type="button"
                className="secondary"
                onClick={() => handleCreateTemplate(weather.id)}
              >
                新建{weather.label}
              </button>
            ))}
          </div>

          <div className="director-level-background-template-list">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={`director-level-background-template-item${selectedTemplate?.id === template.id ? " active" : ""}`}
                onClick={() => selectTemplate(template)}
              >
                <strong>{template.name}</strong>
                <span>{weatherLabel(template.weather)}</span>
                <span className="meta">{template.id}</span>
              </button>
            ))}
          </div>

          <div className="actions">
            <button type="button" className="secondary" onClick={handleResetDefaults}>
              恢复默认模板
            </button>
          </div>
        </section>

        <section className="feature-card director-level-background-editor">
          {draft ? (
            <>
              <div className="card-header">
                <strong>模板编辑</strong>
                <span>{draft.id}</span>
              </div>

              <LevelBackgroundTemplateEditor userId={userId} draft={draft} onChange={setDraft} />

              <div className="actions">
                <button type="button" onClick={handleSave}>
                  保存模板
                </button>
                <button type="button" className="secondary" onClick={handleDelete}>
                  删除模板
                </button>
              </div>

              <div className="director-level-background-preview-shell">
                <div className="card-header">
                  <strong>动态预览</strong>
                  <span>
                    {weatherLabel(draft.weather)}
                    {resolvedPanelDesign ? " · 面板模板" : " · 渐变色"}
                    {resolvedCloudDesigns.length > 0 ? ` · ${resolvedCloudDesigns.length} 种云朵` : " · 默认云朵"}
                  </span>
                </div>
                <LevelBackgroundPreview
                  template={draft}
                  panelBackgroundDesign={resolvedPanelDesign}
                  cloudPatternDesigns={resolvedCloudDesigns}
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
