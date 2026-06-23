import { useMemo, useRef, useState } from "react";
import { createStretchVisualTemplate } from "../../../../api/ui/stretchtemplates/CreateStretchVisualTemplateApi.js";
import { useDirectorTemplateLibrary } from "../../../../hook/useDirectorTemplateLibrary.js";
import {
  createLibraryTemplateSelectOptions,
  getPanelDecorationSelectValue,
  resolvePanelDecoration,
} from "../../../../lib/director-template-select.js";
import {
  createLevelStageCustomStyleTemplate,
  createLevelStageDecorationFromTemplate,
  createLevelStageImageDecoration,
  createLevelStageStyleDecoration,
  filterLevelStageCustomStyles,
  getLevelStageBackgroundMode,
  LEVEL_STAGE_BACKGROUND_PRESETS,
  normalizeLevelStageDecoration,
  type LevelStageBackgroundPresetId,
} from "../../../../lib/level-stage-background.js";
import { processTemplateImage } from "../../../../lib/template-image-utils.js";
import { saveVisualAsset } from "../../../../lib/ui-visual-asset-store.js";
import type { PanelDecoration } from "../../../../objects/ui-customization/ui-customization-objects.js";

type LevelStageBackgroundEditorProps = {
  userId: string;
  decoration: PanelDecoration;
  onChange: (decoration: PanelDecoration) => void;
  onSave: () => void;
  onClose: () => void;
  saveMessage: string;
  saveError: string;
  savingBackground?: boolean;
};

export const LevelStageBackgroundEditor = ({
  userId,
  decoration,
  onChange,
  onSave,
  onClose,
  saveMessage,
  saveError,
  savingBackground = false,
}: LevelStageBackgroundEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    panelTemplates,
    loading: templatesLoading,
    error: templatesError,
    reload: reloadPanelTemplates,
  } = useDirectorTemplateLibrary(userId);
  const panelTemplateMap = new Map(panelTemplates.map((template) => [template.id, template]));
  const panelTemplateSelectOptions = createLibraryTemplateSelectOptions(panelTemplates);
  const customStyles = useMemo(
    () => filterLevelStageCustomStyles(panelTemplates),
    [panelTemplates],
  );
  const normalizedDecoration = normalizeLevelStageDecoration(decoration);
  const backgroundMode = getLevelStageBackgroundMode(normalizedDecoration);
  const [uploadError, setUploadError] = useState("");
  const [styleName, setStyleName] = useState("");
  const [saveStyleMessage, setSaveStyleMessage] = useState("");
  const [saveStyleError, setSaveStyleError] = useState("");
  const [savingStyle, setSavingStyle] = useState(false);
  const [styleTabActive, setStyleTabActive] = useState(backgroundMode === "style");

  const activePreset = LEVEL_STAGE_BACKGROUND_PRESETS.find(
    (preset) => preset.id === normalizedDecoration.templateId,
  ) ?? LEVEL_STAGE_BACKGROUND_PRESETS[0]!;

  const activeCustomStyleId = normalizedDecoration.backgroundDesign?.templateId ?? "";
  const activeCustomStyle = customStyles.find((template) => template.id === activeCustomStyleId) ?? null;

  const defaultStyleName = `自定义背景 ${customStyles.length + 1}`;

  const handlePresetChange = (presetId: LevelStageBackgroundPresetId) => {
    setStyleTabActive(true);
    onChange(createLevelStageStyleDecoration(presetId, normalizedDecoration.accentColor));
  };

  const handleCustomStyleChange = (templateId: string) => {
    const template = panelTemplateMap.get(templateId);
    if (!template) {
      return;
    }

    setStyleTabActive(true);
    onChange(createLevelStageDecorationFromTemplate(template, normalizedDecoration.accentColor));
  };

  const handleAccentChange = (accentColor: string) => {
    if (backgroundMode === "image") {
      onChange({
        ...normalizedDecoration,
        accentColor,
      });
      return;
    }

    onChange(createLevelStageStyleDecoration(activePreset.id, accentColor));
  };

  const handleImageUpload = (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("请上传图片文件。");
      return;
    }

    setUploadError("");
    setSaveStyleMessage("");
    setSaveStyleError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setUploadError("读取图片失败。");
        return;
      }

      setStyleTabActive(false);
      onChange(createLevelStageImageDecoration(
        reader.result,
        `upload-${Date.now().toString(36)}`,
        normalizedDecoration.accentColor,
      ));
    };
    reader.onerror = () => {
      setUploadError("读取图片失败。");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAsNewStyle = async () => {
    const sourceDataUrl = normalizedDecoration.backgroundDesign?.sourceDataUrl;
    if (!sourceDataUrl) {
      setSaveStyleError("请先上传图片，再保存为新样式。");
      return;
    }

    setSavingStyle(true);
    setSaveStyleMessage("");
    setSaveStyleError("");

    try {
      const processedSource = await processTemplateImage(sourceDataUrl);
      const template = createLevelStageCustomStyleTemplate(
        styleName.trim() || defaultStyleName,
        processedSource,
      );
      const savedTemplate = await createStretchVisualTemplate(userId, template);
      await saveVisualAsset(savedTemplate.id, savedTemplate.sourceDataUrl);
      reloadPanelTemplates();
      setStyleName("");
      setStyleTabActive(true);
      onChange(createLevelStageDecorationFromTemplate(savedTemplate, normalizedDecoration.accentColor));
      setSaveStyleMessage(`已保存为新样式「${savedTemplate.name}」，可在背景样式中复用。`);
    } catch (error) {
      setSaveStyleError(error instanceof Error ? error.message : "保存新样式失败。");
    } finally {
      setSavingStyle(false);
    }
  };

  const handleLibrarySelect = (value: string) => {
    if (!value) {
      return;
    }

    const nextDecoration = resolvePanelDecoration(
      value,
      panelTemplateMap,
      normalizedDecoration.accentColor,
    );

    if (!nextDecoration?.backgroundDesign) {
      return;
    }

    setStyleTabActive(false);
    onChange(nextDecoration);
  };

  const handleUseStyleMode = () => {
    setStyleTabActive(true);
    if (activeCustomStyle) {
      onChange(createLevelStageDecorationFromTemplate(activeCustomStyle, normalizedDecoration.accentColor));
      return;
    }

    onChange(createLevelStageStyleDecoration(activePreset.id, normalizedDecoration.accentColor));
  };

  const handleOpenUploadMode = () => {
    setStyleTabActive(false);
    fileInputRef.current?.click();
  };

  return (
    <section className="level-interface-background-editor panel-create-form">
      <div className="level-interface-background-editor-header">
        <div>
          <h3>优化背景</h3>
          <p className="panel-copy">
            推荐使用背景样式快速搭出地图氛围；上传图片后可保存为新样式，并在背景样式里复用。
          </p>
        </div>
        <button type="button" className="secondary" onClick={onClose}>
          收起
        </button>
      </div>

      <div className="level-interface-background-mode-tabs">
        <button
          type="button"
          className={styleTabActive ? "active" : ""}
          onClick={handleUseStyleMode}
        >
          背景样式
        </button>
        <button
          type="button"
          className={!styleTabActive ? "active" : ""}
          onClick={handleOpenUploadMode}
        >
          上传图片
        </button>
      </div>

      {styleTabActive ? (
        <>
          <div className="level-interface-background-style-grid">
            {LEVEL_STAGE_BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`level-interface-background-style-card ${!activeCustomStyle && activePreset.id === preset.id ? "selected" : ""}`}
                onClick={() => handlePresetChange(preset.id)}
              >
                <span className={`level-interface-background-style-sample preset-${preset.id}`} aria-hidden="true" />
                <strong>{preset.label}</strong>
                <span>{preset.description}</span>
              </button>
            ))}
          </div>

          {customStyles.length > 0 ? (
            <div className="level-interface-background-custom-styles">
              <h4>我的背景样式</h4>
              <div className="level-interface-background-style-grid">
                {customStyles.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className={`level-interface-background-style-card ${activeCustomStyleId === template.id ? "selected" : ""}`}
                    onClick={() => handleCustomStyleChange(template.id)}
                  >
                    <span
                      className="level-interface-background-style-sample preset-custom"
                      style={{ backgroundImage: `url("${template.sourceDataUrl}")` }}
                      aria-hidden="true"
                    />
                    <strong>{template.name}</strong>
                    <span>已保存的自定义图片背景</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="level-interface-background-image-panel">
          {normalizedDecoration.backgroundDesign ? (
            <div
              className="level-interface-background-image-preview"
              style={{ backgroundImage: `url("${normalizedDecoration.backgroundDesign.sourceDataUrl}")` }}
            />
          ) : (
            <p className="meta">尚未选择图片，请上传或使用模板库。</p>
          )}
          <div className="level-interface-background-image-actions">
            <button type="button" onClick={() => fileInputRef.current?.click()}>
              选择本地图片
            </button>
            <label className="button-design-field">
              <span>模板库图片</span>
              <select
                value={getPanelDecorationSelectValue(normalizedDecoration)}
                disabled={templatesLoading}
                onChange={(event) => handleLibrarySelect(event.target.value)}
              >
                <option value="">
                  {panelTemplateSelectOptions.length > 0 ? "请选择模板" : "暂无模板，请先到模板库创建"}
                </option>
                {panelTemplateSelectOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {normalizedDecoration.backgroundDesign ? (
            <div className="level-interface-background-save-style-panel">
              <label className="button-design-field">
                <span>样式名称</span>
                <input
                  type="text"
                  value={styleName}
                  placeholder={defaultStyleName}
                  onChange={(event) => setStyleName(event.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  void handleSaveAsNewStyle();
                }}
                disabled={savingStyle}
              >
                {savingStyle ? "保存中..." : "保存为新样式"}
              </button>
            </div>
          ) : null}

          {uploadError ? <p className="feedback error">{uploadError}</p> : null}
          {saveStyleMessage ? <p className="feedback success">{saveStyleMessage}</p> : null}
          {saveStyleError ? <p className="feedback error">{saveStyleError}</p> : null}
          {templatesError ? <p className="feedback error">{templatesError}</p> : null}
        </div>
      )}

      <label className="button-design-color-field">
        <span>强调色</span>
        <input
          type="color"
          value={normalizedDecoration.accentColor ?? activePreset.defaultAccent}
          onChange={(event) => handleAccentChange(event.target.value)}
        />
      </label>

      <div className="level-interface-background-editor-actions">
        <button type="button" onClick={onSave} disabled={savingBackground}>
          {savingBackground ? "保存中..." : "保存背景到全部关卡地图"}
        </button>
        <button type="button" className="secondary" onClick={onClose}>
          取消
        </button>
      </div>

      {saveMessage ? <p className="feedback success">{saveMessage}</p> : null}
      {saveError ? <p className="feedback error">{saveError}</p> : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          handleImageUpload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </section>
  );
};
