import { useMemo, useState } from "react";
import { useDirectorTemplateLibrary } from "../../../shared/hooks/useDirectorTemplateLibrary.js";
import { processButtonBaseDesign, processStretchVisualDesign } from "../../../../lib/template-image-utils.js";
import {
  createLibraryTemplateSelectOptions,
  createButtonStateDraftPatchFromBaseTemplate,
  createButtonStateDraftPatchFromPatternTemplate,
} from "../../../../lib/director-template-select.js";
import {
  createPatternLayerFromTemplate,
} from "./button-state-template-preview.js";
import { LevelNodeButtonStatePreview } from "./LevelNodeButtonStatePreview.js";
import {
  LEVEL_NODE_PROGRESS_STATE_META,
  LEVEL_NODE_PROGRESS_STATE_IDS,
  copyLevelNodeStateDesign,
  formatLevelNodeButtonLabel,
  getStateDesignTemplateSelectValues,
  updateLevelNodePatternLayerFrame,
  updateLevelNodeStateDesign,
  type LevelNodeButtonFormatSettings,
  type LevelNodeProgressStateId,
  type LevelNodeStateButtonDesign,
} from "../../../../lib/level-node-button-format.js";
import { LEVEL_NODE_DEFINITIONS } from "../../../../objects/ui-customization/level-map-structure.js";

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

  const editingStateId = previewState;
  const editingDesign = format.stateDesigns[editingStateId];
  const templateSelectValues = getStateDesignTemplateSelectValues(editingDesign);

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
    ...editingDesign,
    icon: format.stateIcons[previewState],
    label: previewLabel,
  }), [editingDesign, format.stateIcons, previewLabel, previewState]);

  const updateStateDesign = (patch: Partial<LevelNodeStateButtonDesign>) => {
    onChange(updateLevelNodeStateDesign(format, editingStateId, patch));
  };

  const applyBaseTemplateSelection = (value: string) => {
    if (!value) {
      const { baseDesign: _removed, ...rest } = editingDesign;
      updateStateDesign({
        ...rest,
        baseTemplateValue: "",
      });
      return;
    }

    const resolved = createButtonStateDraftPatchFromBaseTemplate(value, buttonTemplateMap);
    if (!resolved.baseDesign) {
      updateStateDesign({
        baseTemplateValue: value,
      });
      return;
    }

    void processButtonBaseDesign(resolved.baseDesign).then((baseDesign) => {
      updateStateDesign({
        baseTemplateValue: value,
        baseDesign,
      });
    });
  };

  const applyPatternTemplateSelection = (value: string) => {
    if (!value) {
      const { patternDesign: _removed, ...rest } = editingDesign;
      updateStateDesign({
        ...rest,
        contentType: "text",
        patternTemplateValue: "",
        patternLayers: [],
      });
      return;
    }

    const resolved = createButtonStateDraftPatchFromPatternTemplate(value, patternTemplateMap);
    if (!resolved.patternDesign) {
      updateStateDesign({ patternTemplateValue: value });
      return;
    }

    void processStretchVisualDesign(resolved.patternDesign).then((patternDesign) => {
      updateStateDesign({
        contentType: "pattern",
        patternTemplateValue: value,
        patternDesign,
        patternLayers: createPatternLayerFromTemplate(value, patternDesign),
      });
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

  const copyDesignFromState = (fromStateId: LevelNodeProgressStateId) => {
    onChange(copyLevelNodeStateDesign(format, fromStateId, editingStateId));
  };

  const handlePatternLayerFrameChange = (layerId: string, frame: NonNullable<LevelNodeStateButtonDesign["patternDesign"]>["frame"]) => {
    if (!frame) {
      return;
    }

    onChange(updateLevelNodePatternLayerFrame(format, editingStateId, layerId, frame));
  };

  const otherStateIds = LEVEL_NODE_PROGRESS_STATE_IDS.filter((stateId) => stateId !== editingStateId);

  return (
    <section className="level-interface-button-format-editor panel-create-form">
      <div className="level-interface-background-editor-header">
        <div>
          <h3>按钮格式设置</h3>
          <p className="panel-copy">
            为未解锁、未通关、已通关三种状态分别配置底座与图案。运行时根据玩家登录账号与关卡进度自动切换状态。
          </p>
        </div>
        <button type="button" className="secondary" onClick={onClose}>
          收起
        </button>
      </div>

      <div className="level-interface-button-format-workspace">
        <div className="level-interface-button-format-editor-column">
          <div className="level-interface-background-mode-tabs">
            <button
              type="button"
              className={activeSection === "template" ? "active" : ""}
              onClick={() => setActiveSection("template")}
            >
              状态样式
            </button>
            <button
              type="button"
              className={activeSection === "text" ? "active" : ""}
              onClick={() => setActiveSection("text")}
            >
              状态文案
            </button>
          </div>

          <div className="level-interface-button-format-state-switch">
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

          {activeSection === "template" ? (
            <div className="level-interface-button-format-template-panel">
              <div className="level-interface-button-format-copy-row">
                <span className="meta">正在编辑：{LEVEL_NODE_PROGRESS_STATE_META.find((item) => item.id === editingStateId)?.name}</span>
                {otherStateIds.map((stateId) => (
                  <button
                    key={stateId}
                    type="button"
                    className="secondary"
                    onClick={() => copyDesignFromState(stateId)}
                  >
                    复制自{LEVEL_NODE_PROGRESS_STATE_META.find((item) => item.id === stateId)?.name}
                  </button>
                ))}
              </div>

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
                    value={editingDesign.contentType}
                    onChange={(event) => {
                      const contentType = event.target.value as "text" | "pattern";
                      if (contentType === "text") {
                        const { patternDesign: _removed, ...rest } = editingDesign;
                        updateStateDesign({
                          ...rest,
                          contentType: "text",
                          patternTemplateValue: "",
                          patternLayers: [],
                        });
                        return;
                      }

                      updateStateDesign({ contentType: "pattern" });
                    }}
                  >
                    <option value="text">文本型</option>
                    <option value="pattern">图案型</option>
                  </select>
                </label>

                {editingDesign.contentType === "pattern" ? (
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
                    value={editingDesign.variant}
                    onChange={(event) => updateStateDesign({
                      variant: event.target.value as LevelNodeStateButtonDesign["variant"],
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
                    value={editingDesign.borderRadius}
                    onChange={(event) => updateStateDesign({ borderRadius: Number(event.target.value) || 0 })}
                  />
                </label>

                <label className="button-design-color-field">
                  <span>背景色</span>
                  <input
                    type="color"
                    value={editingDesign.backgroundColor}
                    disabled={Boolean(editingDesign.baseDesign)}
                    onChange={(event) => updateStateDesign({ backgroundColor: event.target.value })}
                  />
                </label>

                <label className="button-design-color-field">
                  <span>文字色</span>
                  <input
                    type="color"
                    value={editingDesign.textColor}
                    onChange={(event) => updateStateDesign({ textColor: event.target.value })}
                  />
                </label>

                <label className="button-design-field">
                  <span>字号</span>
                  <input
                    type="number"
                    min={8}
                    max={14}
                    value={editingDesign.fontSize}
                    onChange={(event) => updateStateDesign({
                      fontSize: Math.min(14, Number(event.target.value) || 11),
                    })}
                  />
                </label>
              </div>

              {editingDesign.baseDesign ? (
                <p className="meta">已绑定底座模板，按钮外形由模板决定；背景色仅在未使用模板时生效。</p>
              ) : null}
              {editingDesign.contentType === "pattern" && editingDesign.patternLayers.length > 0 ? (
                <p className="meta">在右侧预览区拖拽图案可调整位置，拖拽角点可缩放。</p>
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
                  {format.stateDesigns[state.id].contentType === "text" ? (
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
        </div>

        <div className="level-interface-button-format-preview-column">
          <div className="level-interface-button-format-preview-panel level-interface-button-format-preview-panel-large">
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
            </div>

            <div className="level-interface-button-format-preview-sample level-interface-button-format-preview-sample-large">
              <LevelNodeButtonStatePreview
                state={previewButtonState}
                disabled={false}
                editable={editingDesign.contentType === "pattern" && editingDesign.patternLayers.length > 0}
                onPatternLayerFrameChange={handlePatternLayerFrameChange}
              />
            </div>
            <p className="meta">
              右侧地图会同步当前预览状态。玩家进度由后端接口 `player.levelProgress` 计算：前一关通关则解锁下一关，通关后显示已通关样式。
            </p>
          </div>
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
