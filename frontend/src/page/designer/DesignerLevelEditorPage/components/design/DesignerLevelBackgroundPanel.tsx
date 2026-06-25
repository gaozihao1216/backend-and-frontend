import { useMemo } from "react";
import { LevelBackgroundPreview } from "../../../../director/DirectorLevelBackgroundTemplatesPage/components/LevelBackgroundPreview.js";
import { useLevelBackgroundTemplateResolution } from "../../../../shared/hooks/level-background/useLevelBackgroundTemplateResolution.js";
import {
  listLevelBackgroundTemplates,
} from "../../../../shared/function/level-background/level-background-template-store.js";
import {
  resolveLevelBackgroundCloudDesigns,
  resolveLevelBackgroundPanelDesign,
} from "../../../../shared/function/level-background/level-background-template-render.js";
import { useDirectorTemplateLibrary } from "../../../../shared/hooks/template/useDirectorTemplateLibrary.js";
import { LEVEL_BACKGROUND_WEATHER_META } from "../../../../../objects/level/level-background-template.js";

type DesignerLevelBackgroundPanelProps = {
  userId: string;
  selectedTemplateId?: string;
  onSelectTemplate: (templateId: string | undefined) => void;
};

const weatherLabel = (weather: string) =>
  LEVEL_BACKGROUND_WEATHER_META.find((entry) => entry.id === weather)?.label ?? weather;

export const DesignerLevelBackgroundPanel = ({
  userId,
  selectedTemplateId,
  onSelectTemplate,
}: DesignerLevelBackgroundPanelProps) => {
  const templates = useMemo(() => listLevelBackgroundTemplates(), []);
  const { panelTemplates, patternTemplates } = useDirectorTemplateLibrary(userId);
  const panelTemplateMap = useMemo(
    () => new Map(panelTemplates.map((template) => [template.id, template])),
    [panelTemplates],
  );
  const patternTemplateMap = useMemo(
    () => new Map(patternTemplates.map((template) => [template.id, template])),
    [patternTemplates],
  );
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );
  const {
    template: resolvedTemplate,
    panelBackgroundDesign,
    cloudPatternDesigns,
    loading,
    error,
  } = useLevelBackgroundTemplateResolution(selectedTemplateId, userId);

  return (
    <fieldset className="designer-level-background-panel">
      <legend>关卡背景模板</legend>
      <p className="meta">
        选择总监配置的关卡背景模板。背景会显示在编辑画布与试玩预览中，并随关卡数据一并保存。
      </p>

      <div className="designer-level-background-options">
        <button
          type="button"
          className={`secondary designer-level-background-option${!selectedTemplateId ? " active" : ""}`}
          onClick={() => onSelectTemplate(undefined)}
        >
          <strong>默认天空</strong>
          <span>使用编辑器内置渐变背景</span>
        </button>

        {templates.map((template) => {
          const previewPanelDesign = resolveLevelBackgroundPanelDesign(template, panelTemplateMap);
          const previewCloudDesigns = resolveLevelBackgroundCloudDesigns(template, patternTemplateMap);

          return (
            <button
              key={template.id}
              type="button"
              className={`designer-level-background-option${selectedTemplateId === template.id ? " active" : ""}`}
              onClick={() => onSelectTemplate(template.id)}
            >
              <div className="designer-level-background-option-preview" aria-hidden="true">
                <LevelBackgroundPreview
                  template={template}
                  panelBackgroundDesign={previewPanelDesign}
                  cloudPatternDesigns={previewCloudDesigns}
                  width={240}
                  height={135}
                  className="designer-level-background-option-preview-canvas"
                />
              </div>
              <div className="designer-level-background-option-copy">
                <strong>{template.name}</strong>
                <span>{weatherLabel(template.weather)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedTemplate ? (
        <div className="designer-level-background-selected-preview">
          <div className="card-header">
            <strong>当前背景</strong>
            <span>{selectedTemplate.name}</span>
          </div>
          {loading ? <p className="meta">正在加载背景资源…</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}
          {resolvedTemplate ? (
            <div className="designer-level-background-selected-shell">
              <LevelBackgroundPreview
                template={resolvedTemplate}
                panelBackgroundDesign={panelBackgroundDesign}
                cloudPatternDesigns={cloudPatternDesigns}
                width={960}
                height={540}
                className="designer-level-background-selected-canvas"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
};
