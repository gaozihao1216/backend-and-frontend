import { useMemo, useState } from "react";
import { useDirectorTemplateLibrary } from "../../hook/useDirectorTemplateLibrary.js";
import {
  createLibraryTemplateSelectOptions,
  createButtonStateDraftPatchFromBaseTemplate,
  createButtonStateDraftPatchFromPatternTemplate,
} from "../../lib/director-template-select.js";
import {
  createPatternLayerFromTemplate,
  getButtonStateTemplatePreviewClassName,
  getButtonStateTemplatePreviewStyle,
  renderButtonStateTemplatePreviewContent,
  renderButtonStateTemplatePreviewLayers,
} from "./button-state-template-preview.js";
import {
  LEVEL_NODE_PROGRESS_STATE_META,
  LEVEL_NODE_PROGRESS_STATE_IDS,
  formatLevelNodeButtonLabel,
  getSharedDesignTemplateSelectValues,
  type LevelNodeButtonFormatSettings,
  type LevelNodeProgressStateId,
  type LevelNodeSharedButtonDesign,
} from "../../lib/level-node-button-format.js";
import { LEVEL_NODE_DEFINITIONS } from "../../objects/ui-customization/level-map-structure.js";

type LevelNodeButtonFormatEditorProps = {
  userId: string;
  format: LevelNodeButtonFormatSettings;
  onChange: (format: LevelNodeButtonFormatSettings) => void;
  previewState: LevelNodeProgressStateId;
  onPreviewStateChange: (stateId: LevelNodeProgressStateId) => void;
  previewLevelSuffix: string;
  onPreviewLevelSuffixChange: (suffix: string) => void;
  onSave: () => void;
  onClose: () => void;
  saveMessage: string;
  saveError: string;
  saving?: boolean;
};

const variantOptions = [
  { value: "primary", label: "主按钮" },
  { value: "secondary", label: "次按钮" },
  { value: "ghost", label: "轻按钮" },
] as const;

export const LevelNodeButtonFormatEditor = ({
  userId,
  format,
  onChange,
  previewState,
  onPreviewStateChange,
  previewLevelSuffix,
  onPreviewLevelSuffixChange,
  onSave,
  onClose,
  saveMessage,
  saveError,
  saving = false,
}: LevelNodeButtonFormatEditorProps) => {
  const [activeSection, setActiveSection] = useState<"template" | "text">("template");
  const {
    buttonTemplates,
    patternTemplates,
    loading: templatesLoading,
    error: templatesError,
  } = useDirectorTemplateLibrary(userId);
  const buttonTemplateMap = useMemo(
    () => new Map(buttonTemplates.map((template) => [template.id, template])),
    [buttonTemplates],
  );
  const patternTemplateMap = useMemo(
    () => new Map(patternTemplates.map((template) => [template.id, template])),
    [patternTemplates],
  );
  const buttonTemplateSelectOptions = useMemo(
    () => createLibraryTemplateSelectOptions(buttonTemplates),
    [buttonTemplates],
  );
  const patternTemplateSelectOptions = useMemo(
    () => createLibraryTemplateSelectOptions(patternTemplates),
    [patternTemplates],
  );
  const templateSelectValues = getSharedDesignTemplateSelectValues(format.sharedDesign);

  const previewLevel = useMemo(
    () => LEVEL_NODE_DEFINITIONS.find((level) => level.suffix === previewLevelSuffix) ?? LEVEL_NODE_DEFINITIONS[0]!,
    [previewLevelSuffix],
  );

  const previewLabel = useMemo(
    () => formatLevelNodeButtonLabel(
      previewLevel.suffix,
      previewLevel.label,
      previewState,
      format,
    ),
    [format, previewLevel.label, previewLevel.suffix, previewState],
  );

  const previewButtonState = useMemo(() => ({
    ...format.sharedDesign,
    icon: format.stateIcons[previewState],
    label: previewLabel,
  }), [format.sharedDesign, format.stateIcons, previewLabel, previewState]);

  const updateSharedDesign = (patch: Partial<LevelNodeSharedButtonDesign>) => {
    onChange({
      ...format,
      sharedDesign: {
        ...format.sharedDesign,
        ...patch,
      },
    });
  };

  const applyBaseTemplateSelection = (value: string) => {
    if (!value) {
      const { baseDesign: _removed, ...rest } = format.sharedDesign;
      updateSharedDesign({
        ...rest,
        baseTemplateValue: "",
      });
      return;
    }

    const resolved = createButtonStateDraftPatchFromBaseTemplate(value, buttonTemplateMap);
    updateSharedDesign({
      baseTemplateValue: value,
      ...(resolved.baseDesign ? { baseDesign: resolved.baseDesign } : {}),
    });
  };

  const applyPatternTemplateSelection = (value: string) => {
    if (!value) {
      const { patternDesign: _removed, ...rest } = format.sharedDesign;
      updateSharedDesign({
        ...rest,
        contentType: "text",
        patternTemplateValue: "",
        patternLayers: [],
      });
      return;
    }

    const resolved = createButtonStateDraftPatchFromPatternTemplate(value, patternTemplateMap);
    if (!resolved.patternDesign) {
      updateSharedDesign({ patternTemplateValue: value });
      return;
    }

    updateSharedDesign({
      contentType: "pattern",
      patternTemplateValue: value,
      patternDesign: resolved.patternDesign,
      patternLayers: createPatternLayerFromTemplate(value, resolved.patternDesign),
    });
  };

  const updateStateLabel = (stateId: LevelNodeProgressStateId, label: string) => {
    onChange({
      ...format,
      stateLabels: {
        ...format.stateLabels,
        [stateId]: label,
      },
    });
  };

  const updateStateIcon = (stateId: LevelNodeProgressStateId, icon: string) => {
    onChange({
      ...format,
      stateIcons: {
        ...format.stateIcons,
        [stateId]: icon,
      },
    });
  };

  return (
    <section className="level-interface-button-format-editor panel-create-form">
      <div className="level-interface-background-editor-header">
        <div>
          <h3>按钮格式设置</h3>
          <p className="panel-copy">
            通过模板库配置关卡节点按钮的统一样式。三种状态共用底座/图案模板，仅切换显示文案。
          </p>
        </div>
        <button type="button" className="secondary" onClick={onClose}>
          收起
        </button>
      </div>

      <div className="level-interface-background-mode-tabs">
        <button
          type="button"
          className={activeSection === "template" ? "active" : ""}
          onClick={() => setActiveSection("template")}
        >
          模板与样式
        </button>
        <button
          type="button"
          className={activeSection === "text" ? "active" : ""}
          onClick={() => setActiveSection("text")}
        >
          状态文案
        </button>
      </div>

      {activeSection === "template" ? (
        <div className="level-interface-button-format-template-panel">
          <div className="level-interface-button-format-grid">
            <label className="button-design-field">
              <span>底座模板</span>
              <select
                value={templateSelectValues.baseTemplateValue}
                disabled={templatesLoading}
                onChange={(event) => applyBaseTemplateSelection(event.target.value)}
              >
                <option value="">
                  {buttonTemplateSelectOptions.length > 0 ? "不使用模板（纯色按钮）" : "暂无底座模板，请先到模板库创建"}
                </option>
                {buttonTemplateSelectOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="button-design-field">
              <span>内容类型</span>
              <select
                value={format.sharedDesign.contentType}
                onChange={(event) => {
                  const contentType = event.target.value as "text" | "pattern";
                  if (contentType === "text") {
                    const { patternDesign: _removed, ...rest } = format.sharedDesign;
                    updateSharedDesign({
                      ...rest,
                      contentType: "text",
                      patternTemplateValue: "",
                      patternLayers: [],
                    });
                    return;
                  }

                  updateSharedDesign({ contentType: "pattern" });
                }}
              >
                <option value="text">文本型</option>
                <option value="pattern">图案型</option>
              </select>
            </label>

            {format.sharedDesign.contentType === "pattern" ? (
              <label className="button-design-field">
                <span>图案模板</span>
                <select
                  value={templateSelectValues.patternTemplateValue}
                  disabled={templatesLoading}
                  onChange={(event) => applyPatternTemplateSelection(event.target.value)}
                >
                  <option value="">
                    {patternTemplateSelectOptions.length > 0 ? "请选择图案模板" : "暂无图案模板，请先到模板库创建"}
                  </option>
                  {patternTemplateSelectOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="button-design-field">
              <span>按钮类型</span>
              <select
                value={format.sharedDesign.variant}
                onChange={(event) => updateSharedDesign({
                  variant: event.target.value as LevelNodeSharedButtonDesign["variant"],
                })}
              >
                {variantOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="button-design-field">
              <span>圆角</span>
              <input
                type="number"
                min={0}
                max={999}
                value={format.sharedDesign.borderRadius}
                onChange={(event) => updateSharedDesign({ borderRadius: Number(event.target.value) || 0 })}
              />
            </label>

            <label className="button-design-color-field">
              <span>背景色</span>
              <input
                type="color"
                value={format.sharedDesign.backgroundColor}
                disabled={Boolean(format.sharedDesign.baseDesign)}
                onChange={(event) => updateSharedDesign({ backgroundColor: event.target.value })}
              />
            </label>

            <label className="button-design-color-field">
              <span>文字色</span>
              <input
                type="color"
                value={format.sharedDesign.textColor}
                onChange={(event) => updateSharedDesign({ textColor: event.target.value })}
              />
            </label>

            <label className="button-design-field">
              <span>字号</span>
              <input
                type="number"
                min={8}
                max={14}
                value={format.sharedDesign.fontSize}
                onChange={(event) => updateSharedDesign({
                  fontSize: Math.min(14, Number(event.target.value) || 11),
                })}
              />
            </label>
            <p className="meta">关卡节点按钮建议使用 10–14px 字号，避免路径地图上文字过大。</p>
          </div>

          {format.sharedDesign.baseDesign ? (
            <p className="meta">已绑定底座模板，按钮外形由模板决定；背景色仅在未使用模板时生效。</p>
          ) : null}
          {templatesError ? <p className="feedback error">{templatesError}</p> : null}
        </div>
      ) : (
        <div className="level-interface-button-format-states">
          <label className="button-design-field">
            <span>文案模式</span>
            <select
              value={format.labelMode}
              onChange={(event) => onChange({
                ...format,
                labelMode: event.target.value as LevelNodeButtonFormatSettings["labelMode"],
              })}
            >
              <option value="levelAndState">关卡名 + 状态（例如：01 草地训练场 · 未通关）</option>
              <option value="levelNumberAndState">关卡编号 + 状态（例如：01 · 未通关）</option>
              <option value="stateOnly">仅显示状态（例如：未通关）</option>
            </select>
          </label>

          {LEVEL_NODE_PROGRESS_STATE_META.map((state) => (
            <div key={state.id} className="level-interface-button-format-state-row">
              <div>
                <strong>{state.name}</strong>
                <p className="meta">{state.description}</p>
              </div>
              <label className="button-design-field">
                <span>显示文字</span>
                <input
                  type="text"
                  value={format.stateLabels[state.id]}
                  onChange={(event) => updateStateLabel(state.id, event.target.value)}
                />
              </label>
              {format.sharedDesign.contentType === "text" ? (
                <label className="button-design-field">
                  <span>图标</span>
                  <input
                    type="text"
                    value={format.stateIcons[state.id]}
                    onChange={(event) => updateStateIcon(state.id, event.target.value)}
                  />
                </label>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="level-interface-button-format-preview-panel">
        <div className="level-interface-button-format-preview-controls">
          <label className="button-design-field">
            <span>预览关卡</span>
            <select
              value={previewLevelSuffix}
              onChange={(event) => onPreviewLevelSuffixChange(event.target.value)}
            >
              {LEVEL_NODE_DEFINITIONS.map((level) => (
                <option key={level.suffix} value={level.suffix}>{level.label}</option>
              ))}
            </select>
          </label>
          <div className="level-interface-button-format-preview-tabs">
            {LEVEL_NODE_PROGRESS_STATE_IDS.map((stateId) => (
              <button
                key={stateId}
                type="button"
                className={previewState === stateId ? "active" : ""}
                onClick={() => onPreviewStateChange(stateId)}
              >
                {LEVEL_NODE_PROGRESS_STATE_META.find((item) => item.id === stateId)?.name ?? stateId}
              </button>
            ))}
          </div>
        </div>

        <div className="level-interface-button-format-preview-sample">
          <div className="level-interface-button-format-preview-stage">
            <button
              type="button"
              className={`dynamic-ui-button panel-create-button-state-sample ${getButtonStateTemplatePreviewClassName(previewButtonState)}`}
              style={getButtonStateTemplatePreviewStyle(previewButtonState, {
                position: "relative",
                minWidth: "220px",
                minHeight: "56px",
                padding: "0.65rem 1rem",
              })}
              disabled={previewState === "locked"}
            >
              {renderButtonStateTemplatePreviewLayers(previewButtonState)}
              {renderButtonStateTemplatePreviewContent(previewButtonState)}
            </button>
          </div>
          <p className="meta">预览使用与面板创建相同的模板渲染方式；右侧地图会同步所选状态。</p>
        </div>
      </div>

      <div className="level-interface-background-editor-actions">
        <button type="button" onClick={onSave} disabled={saving}>
          {saving ? "保存中..." : "保存按钮格式到全部关卡地图"}
        </button>
        <button type="button" className="secondary" onClick={onClose}>
          取消
        </button>
      </div>

      {saveMessage ? <p className="feedback success">{saveMessage}</p> : null}
      {saveError ? <p className="feedback error">{saveError}</p> : null}
    </section>
  );
};
