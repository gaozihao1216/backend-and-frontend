import { useMemo, useState } from "react";
import { useDirectorTemplateLibrary } from "../../../shared/hooks/template/useDirectorTemplateLibrary.js";
import {
  createLibraryTemplateSelectOptions,
  formatTemplateSelectValue,
  resolvePanelDecoration,
} from "../../shared/function/director-template-select.js";
import {
  createPanelBackgroundDesignFromTemplate,
  toggleCloudPatternDesign,
} from "../../../shared/function/level-background/level-background-template-render.js";
import {
  getPatternTemplateCategoryLabel,
  normalizePanelTemplateCategory,
  normalizePatternTemplateCategory,
  PATTERN_TEMPLATE_CATEGORIES,
} from "../../../../objects/ui/category/template-category.js";
import { TemplateCategoryFilter } from "../../shared/TemplateCategoryFilter.js";
import type { LevelBackgroundTemplate, LevelBackgroundWeather } from "../../../../objects/level/level-background-template.js";
import { LEVEL_BACKGROUND_WEATHER_META } from "../../../../objects/level/level-background-template.js";
import type { StretchVisualTemplate } from "../../../../objects/ui/stretch_template/stretch-visual-template.js";

type LevelBackgroundTemplateEditorProps = {
  userId: string;
  draft: LevelBackgroundTemplate;
  onChange: (nextDraft: LevelBackgroundTemplate) => void;
};

const updateDraft = (
  draft: LevelBackgroundTemplate,
  patch: Partial<LevelBackgroundTemplate>,
): LevelBackgroundTemplate => ({
  ...draft,
  ...patch,
});

const updateEffects = (
  draft: LevelBackgroundTemplate,
  patch: Partial<LevelBackgroundTemplate["effects"]>,
): LevelBackgroundTemplate => ({
  ...draft,
  effects: {
    ...draft.effects,
    ...patch,
  },
});

export const LevelBackgroundTemplateEditor = ({ userId, draft, onChange }: LevelBackgroundTemplateEditorProps) => {
  const {
    panelTemplates,
    patternTemplates,
    loading: templatesLoading,
    error: templatesError,
  } = useDirectorTemplateLibrary(userId);

  const panelTemplateMap = useMemo(
    () => new Map(panelTemplates.map((template) => [template.id, template])),
    [panelTemplates],
  );
  const levelBackgroundPanels = useMemo(
    () => panelTemplates.filter((template) => normalizePanelTemplateCategory(template.category) === "levelBackground"),
    [panelTemplates],
  );
  const panelTemplateOptions = useMemo(
    () => createLibraryTemplateSelectOptions(levelBackgroundPanels),
    [levelBackgroundPanels],
  );
  const [patternCategoryFilter, setPatternCategoryFilter] = useState<typeof PATTERN_TEMPLATE_CATEGORIES[number]["id"] | "all">("all");
  const visiblePatternTemplates = useMemo(
    () => patternCategoryFilter === "all"
      ? patternTemplates
      : patternTemplates.filter((template) => normalizePatternTemplateCategory(template.category) === patternCategoryFilter),
    [patternCategoryFilter, patternTemplates],
  );
  const selectedPanelValue = draft.panelBackgroundDesign
    ? formatTemplateSelectValue("library", draft.panelBackgroundDesign.templateId)
    : "";

  const weatherMeta = LEVEL_BACKGROUND_WEATHER_META.find((entry) => entry.id === draft.weather);

  const handleWeatherChange = (weather: LevelBackgroundWeather) => {
    onChange(updateDraft(draft, { weather }));
  };

  const handlePanelTemplateChange = (value: string) => {
    if (!value) {
      onChange(updateDraft(draft, { panelBackgroundDesign: undefined }));
      return;
    }

    const resolved = resolvePanelDecoration(value, panelTemplateMap, draft.accentColor);
    if (!resolved?.backgroundDesign) {
      return;
    }

    onChange(updateDraft(draft, { panelBackgroundDesign: resolved.backgroundDesign }));
  };

  const handleCloudPatternToggle = (template: StretchVisualTemplate, enabled: boolean) => {
    onChange(updateDraft(draft, {
      cloudPatternDesigns: toggleCloudPatternDesign(draft.cloudPatternDesigns, template, enabled),
    }));
  };

  const handleQuickApplyPanelTemplate = (template: StretchVisualTemplate) => {
    onChange(updateDraft(draft, {
      panelBackgroundDesign: createPanelBackgroundDesignFromTemplate(template),
    }));
  };

  return (
    <div className="level-background-template-editor">
      <label>
        <span>模板名称</span>
        <input
          type="text"
          value={draft.name}
          onChange={(event) => onChange(updateDraft(draft, { name: event.target.value }))}
        />
      </label>

      <fieldset className="level-background-weather-picker">
        <legend>天气款式</legend>
        <div className="level-background-weather-options">
          {LEVEL_BACKGROUND_WEATHER_META.map((option) => (
            <label key={option.id} className={`level-background-weather-option${draft.weather === option.id ? " active" : ""}`}>
              <input
                type="radio"
                name="level-background-weather"
                checked={draft.weather === option.id}
                onChange={() => handleWeatherChange(option.id)}
              />
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {weatherMeta ? <p className="panel-copy">{weatherMeta.description}</p> : null}

      <fieldset className="level-background-template-picker">
        <legend>背景面板模板</legend>
        <p className="panel-copy">背景主图层使用「面板模板 · 关卡背景类」整图拉伸渲染；未选择时回退为下方渐变色。</p>
        {templatesLoading ? <p className="meta">正在加载面板模板...</p> : null}
        {templatesError ? <p className="feedback error">{templatesError}</p> : null}
        {levelBackgroundPanels.length === 0 ? (
          <p className="meta">暂无「关卡背景类」面板模板，请先在模板库中创建并分类。</p>
        ) : null}
        <label>
          <span>面板模板</span>
          <select value={selectedPanelValue} onChange={(event) => handlePanelTemplateChange(event.target.value)}>
            <option value="">无（使用渐变色）</option>
            {panelTemplateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {levelBackgroundPanels.length > 0 ? (
          <div className="level-background-template-quick-list">
            {levelBackgroundPanels.slice(0, 4).map((template) => (
              <button
                key={template.id}
                type="button"
                className={`secondary level-background-template-chip${draft.panelBackgroundDesign?.templateId === template.id ? " active" : ""}`}
                onClick={() => handleQuickApplyPanelTemplate(template)}
              >
                {template.name}
              </button>
            ))}
          </div>
        ) : null}
      </fieldset>

      <fieldset className="level-background-template-picker">
        <legend>云朵图案模板（可多选）</legend>
        <p className="panel-copy">
          云朵使用「图案模板」渲染，可勾选多个模板以增加多样性。可在「模板库 → 图案模板」中继续上传新的云朵图案。
        </p>
        <TemplateCategoryFilter
          categories={PATTERN_TEMPLATE_CATEGORIES}
          activeCategory={patternCategoryFilter}
          onChange={setPatternCategoryFilter}
        />
        {patternTemplates.length === 0 ? (
          <p className="meta">暂无图案模板，请先在模板库中创建云朵图案。</p>
        ) : (
          <div className="level-background-pattern-checklist">
            {visiblePatternTemplates.map((template) => {
              const checked = draft.cloudPatternDesigns.some((design) => design.templateId === template.id);
              return (
                <label key={template.id} className={`level-background-pattern-option${checked ? " active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => handleCloudPatternToggle(template, event.target.checked)}
                  />
                  <span
                    className="level-background-pattern-thumb"
                    style={{ backgroundImage: `url("${template.sourceDataUrl}")` }}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{template.name}</strong>
                    <span className="template-category-badge">
                      {getPatternTemplateCategoryLabel(normalizePatternTemplateCategory(template.category))}
                    </span>
                    <span className="meta">{template.id}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {draft.cloudPatternDesigns.length > 0 ? (
          <p className="meta">已选择 {draft.cloudPatternDesigns.length} 个云朵图案，预览时会随机组合。</p>
        ) : (
          <p className="meta">未选择图案模板时，预览将使用程序绘制的默认云朵。</p>
        )}
      </fieldset>

      <div className="level-background-color-grid">
        <label>
          <span>天空顶部色</span>
          <input
            type="color"
            value={draft.skyTopColor}
            onChange={(event) => onChange(updateDraft(draft, { skyTopColor: event.target.value }))}
          />
        </label>
        <label>
          <span>天空底部色</span>
          <input
            type="color"
            value={draft.skyBottomColor}
            onChange={(event) => onChange(updateDraft(draft, { skyBottomColor: event.target.value }))}
          />
        </label>
        <label>
          <span>地平线色</span>
          <input
            type="color"
            value={draft.horizonColor}
            onChange={(event) => onChange(updateDraft(draft, { horizonColor: event.target.value }))}
          />
        </label>
        <label>
          <span>点缀色</span>
          <input
            type="color"
            value={draft.accentColor}
            onChange={(event) => onChange(updateDraft(draft, { accentColor: event.target.value }))}
          />
        </label>
      </div>

      <div className="level-background-effect-grid">
        {(draft.weather === "sunny" || draft.weather === "rainy" || draft.weather === "thunderstorm") ? (
          <>
            <label>
              <span>云朵密度 ({draft.effects.cloudDensity})</span>
              <input
                type="range"
                min={0}
                max={12}
                value={draft.effects.cloudDensity}
                onChange={(event) => onChange(updateEffects(draft, { cloudDensity: Number(event.target.value) }))}
              />
            </label>
            <label>
              <span>云朵速度 ({draft.effects.cloudSpeed})</span>
              <input
                type="range"
                min={0}
                max={100}
                value={draft.effects.cloudSpeed}
                onChange={(event) => onChange(updateEffects(draft, { cloudSpeed: Number(event.target.value) }))}
              />
            </label>
          </>
        ) : null}

        {(draft.weather === "rainy" || draft.weather === "thunderstorm") ? (
          <>
            <label>
              <span>雨量强度 ({draft.effects.rainIntensity})</span>
              <input
                type="range"
                min={0}
                max={100}
                value={draft.effects.rainIntensity}
                onChange={(event) => onChange(updateEffects(draft, { rainIntensity: Number(event.target.value) }))}
              />
            </label>
            <label>
              <span>雨滴速度 ({draft.effects.rainSpeed})</span>
              <input
                type="range"
                min={1}
                max={30}
                value={draft.effects.rainSpeed}
                onChange={(event) => onChange(updateEffects(draft, { rainSpeed: Number(event.target.value) }))}
              />
            </label>
          </>
        ) : null}

        {draft.weather === "thunderstorm" ? (
          <>
            <label>
              <span>闪电间隔 ({Math.round(draft.effects.lightningIntervalMs / 100) / 10}s)</span>
              <input
                type="range"
                min={800}
                max={12000}
                step={200}
                value={draft.effects.lightningIntervalMs}
                onChange={(event) => onChange(updateEffects(draft, { lightningIntervalMs: Number(event.target.value) }))}
              />
            </label>
            <label>
              <span>闪电亮度 ({Math.round(draft.effects.lightningFlashOpacity * 100)}%)</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={draft.effects.lightningFlashOpacity}
                onChange={(event) => onChange(updateEffects(draft, { lightningFlashOpacity: Number(event.target.value) }))}
              />
            </label>
          </>
        ) : null}
      </div>
    </div>
  );
};
