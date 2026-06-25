import { useMemo, useState } from "react";
import { useDirectorTemplateLibrary } from "../../../shared/hooks/useDirectorTemplateLibrary.js";
import {
  createLevelBackgroundTemplateDraft,
  deleteLevelBackgroundTemplate,
  listLevelBackgroundTemplates,
  resetLevelBackgroundTemplates,
  upsertLevelBackgroundTemplate,
} from "../../../../lib/level-background-template-store.js";
import {
  resolveLevelBackgroundCloudDesigns,
  resolveLevelBackgroundPanelDesign,
} from "../../../../lib/level-background-template-render.js";
import {
  LEVEL_BACKGROUND_WEATHER_META,
  type LevelBackgroundTemplate,
  type LevelBackgroundWeather,
} from "../../../../objects/level/level-background-template.js";

const weatherLabel = (weather: LevelBackgroundWeather) =>
  LEVEL_BACKGROUND_WEATHER_META.find((entry) => entry.id === weather)?.label ?? weather;

export const useDirectorLevelBackgroundTemplatesPage = (userId: string) => {
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

  return {
    templates,
    selectedTemplate,
    draft,
    message,
    error,
    resolvedPanelDesign,
    resolvedCloudDesigns,
    setDraft,
    selectTemplate,
    handleCreateTemplate,
    handleSave,
    handleDelete,
    handleResetDefaults,
  };
};
