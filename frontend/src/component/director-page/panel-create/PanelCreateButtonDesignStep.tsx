import type { DirectorPanelCreateViewModel } from "../../../hook/director-page/useDirectorPanelCreate.js";
import {
  createDefaultArtTextLayerDraft,
  createEmptyPatternLayerDraft,
  getPatternLayerFrame,
  normalizeButtonStatePatternLayerDrafts,
  type ButtonPatternLayerDraft,
} from "../../../lib/button-pattern-layers.js";
import {
  getButtonBaseTemplateSelectValue,
  getPatternLayerTemplateSelectValue,
  resolvePanelDecoration,
} from "../../../lib/director-template-select.js";
import {
  getButtonPreviewStyle,
  getButtonStatePreviewClassName,
  PanelCreateChildOutline,
  renderButtonPreviewContent,
  renderButtonPreviewLayers,
  renderPanelBackgroundLayer,
} from "./panel-create-preview.js";
import {
  getPanelTextArtContainerClassName,
  getPanelTextArtContainerStyle,
  getPanelTextArtContentClassName,
  getPanelTextArtContentStyle,
  getTextArtAccentColor,
  getTextArtAccentHint,
  getTextArtAccentLabel,
  getTextArtGradientDirection,
  getTextArtGradientIntensity,
  isArtTextPreset,
  patchTextArtDesign,
  TEXT_ART_GRADIENT_DIRECTION_OPTIONS,
  TEXT_ART_GRADIENT_INTENSITY_OPTIONS,
  TEXT_ART_PRESET_OPTIONS,
  resolveTextArtDesign,
  usesTextArtGradient,
} from "../../../lib/art-text-styles.js";
import { clamp, getDecorationStyle, getPanelRenderedAspectRatio } from "../../../lib/director-page/panel-create-helpers.js";
import { getButtonStateContentType } from "../../../lib/director-page/panel-create-helpers.js";
import type { PanelPreset } from "../../../objects/director-page/panel-create-types.js";
import { pagePreviewAspectRatio } from "../../../objects/director-page/panel-create-types.js";

type StepProps = { vm: DirectorPanelCreateViewModel };

export const PanelCreateButtonDesignStep = ({ vm }: StepProps) => {
  const {
    templatesLoading,
    step,
    previewStateId,
    setPreviewStateId,
    selectedPatternLayerId,
    buttonPreviewStageRef,
    selectedChildDraft,
    previewButtonState,
    buttonDesignPreviewAspectRatio,
    buttonBaseTemplateSelectOptions,
    patternTemplateSelectOptions,
    updateChildDraft,
    updateButtonStateDraft,
    applyBaseTemplateSelection,
    applyPatternLayerTemplateSelection,
    updatePatternLayers,
    updatePatternLayerFrame,
    addPatternLayerDraft,
    removePatternLayerDraft,
    handleButtonPreviewPatternMovePointerDown,
    handleButtonPreviewPatternResizePointerDown,
    handleButtonPreviewPatternPointerMove,
    handleButtonPreviewPatternPointerUp,
    addButtonStateDraft,
    isPatternLayerCollapsed,
    togglePatternLayerCollapsed,
    selectPatternLayerForPreview,
    applyButtonStateContentType,
    getButtonStateContentType
  } = vm;

  return (
            <div className="panel-create-button-design-layout">
              {selectedChildDraft?.type === "multiStateButton" ? (
                <>
                  <section className="panel-create-button-design-header">
                    <div className="panel-create-button-design-basics panel-create-form">
                      <h3>按钮设计</h3>
                      <label className="button-design-field">
                        <span>按钮名</span>
                        <input
                          value={selectedChildDraft.name}
                          onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                            draft.type === "multiStateButton" ? { ...draft, name: event.target.value } : draft,
                          )}
                        />
                      </label>
                      <div className="panel-create-button-meta-row">
                        <label className="button-design-field">
                          <span>状态数</span>
                          <input value={selectedChildDraft.states.length} readOnly />
                        </label>
                        <label className="button-design-field">
                          <span>默认状态</span>
                          <select
                            value={selectedChildDraft.defaultStateId}
                            onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                              draft.type === "multiStateButton" ? { ...draft, defaultStateId: event.target.value } : draft,
                            )}
                          >
                            {selectedChildDraft.states.map((state) => (
                              <option key={state.id} value={state.id}>{state.name}</option>
                            ))}
                          </select>
                        </label>
                        <label className="button-design-field">
                          <span>预览状态</span>
                          <select
                            value={previewStateId}
                            onChange={(event) => setPreviewStateId(event.target.value)}
                          >
                            {selectedChildDraft.states.map((state) => (
                              <option key={state.id} value={state.id}>{state.name}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="panel-create-button-state-names">
                        <span className="panel-create-button-state-names-label">状态命名</span>
                        <div className="panel-create-button-state-names-grid">
                          {selectedChildDraft.states.map((state, index) => (
                            <label key={state.id} className="panel-create-button-state-name-field">
                              <span>状态 {index + 1}</span>
                              <input
                                value={state.name}
                                onChange={(event) => updateButtonStateDraft(selectedChildDraft.id, state.id, { name: event.target.value })}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                      <button type="button" onClick={() => addButtonStateDraft(selectedChildDraft.id)}>
                        添加状态
                      </button>
                    </div>
                    <section className="panel-create-button-design-preview panel-create-preview">
                      <h3>按钮预览</h3>
                      <p className="meta">
                        预览比例与「美化信息」中该按钮一致。艺术字以文本框为边界，拖动框体移动位置，拖拽四角放大缩小字框（字号随框体同步变化）。
                      </p>
                      {previewButtonState && selectedChildDraft.type === "multiStateButton" ? (
                        <div className="panel-create-button-single-preview">
                          <div
                            ref={buttonPreviewStageRef}
                            className="panel-create-button-single-preview-stage"
                            style={{ aspectRatio: buttonDesignPreviewAspectRatio }}
                            onPointerMove={handleButtonPreviewPatternPointerMove}
                            onPointerUp={handleButtonPreviewPatternPointerUp}
                            onPointerCancel={handleButtonPreviewPatternPointerUp}
                          >
                            <div
                              className={`dynamic-ui-button panel-create-button-state-sample ${getButtonStatePreviewClassName(previewButtonState)}`}
                              style={{
                                ...getButtonPreviewStyle(previewButtonState),
                                position: "absolute",
                                inset: 0,
                                width: "auto",
                                height: "auto",
                              }}
                            >
                              {renderButtonPreviewLayers(previewButtonState, {
                                patternAdjustable: getButtonStateContentType(previewButtonState) === "pattern",
                                activeLayerId: selectedPatternLayerId,
                                onPatternMovePointerDown: (layerId) =>
                                  handleButtonPreviewPatternMovePointerDown(previewButtonState.id, layerId),
                                onPatternResizePointerDown: (layerId, handle) =>
                                  handleButtonPreviewPatternResizePointerDown(previewButtonState.id, layerId, handle),
                              })}
                              {renderButtonPreviewContent(previewButtonState)}
                            </div>
                          </div>
                          <code className="panel-create-button-aspect-readout">
                            宽高比 {selectedChildDraft.position.width}:{selectedChildDraft.position.height}
                          </code>
                        </div>
                      ) : null}
                    </section>
                  </section>

                  <section className="panel-create-button-design-states panel-create-form">
                    <h3>状态设计</h3>
                    <p className="meta">
                      每个状态一列。文本型只需配置显示文字和底座模板；图案型可叠加多个图案/艺术字图层，并分别调节位置与大小。
                    </p>
                    <div className="panel-create-button-state-columns">
                      {selectedChildDraft.states.map((state) => {
                        const contentType = getButtonStateContentType(state);
                        return (
                        <section key={state.id} className="panel-create-button-state-column">
                          <header
                            className="panel-create-button-state-column-header"
                            onClick={() => setPreviewStateId(state.id)}
                          >
                            <strong>{state.name}</strong>
                            <code>{state.id}</code>
                          </header>
                          <label className="button-design-field">
                            <span>按钮类型</span>
                            <select
                              value={contentType}
                              onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                                draft.type === "multiStateButton"
                                  ? {
                                      ...draft,
                                      states: draft.states.map((candidate) =>
                                        candidate.id === state.id
                                          ? applyButtonStateContentType(candidate, event.target.value as "text" | "pattern")
                                          : candidate,
                                      ),
                                    }
                                  : draft,
                              )}
                            >
                              <option value="text">文本型</option>
                              <option value="pattern">图案型</option>
                            </select>
                          </label>
                          <label className="button-design-field">
                            <span>底座模板</span>
                            <select
                              value={getButtonBaseTemplateSelectValue(state)}
                              disabled={templatesLoading}
                              onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                                draft.type === "multiStateButton"
                                  ? {
                                      ...draft,
                                      states: draft.states.map((candidate) =>
                                        candidate.id === state.id
                                          ? applyBaseTemplateSelection(candidate, event.target.value)
                                          : candidate,
                                      ),
                                    }
                                  : draft,
                              )}
                            >
                              <option value="">
                                {buttonBaseTemplateSelectOptions.length > 0 ? "请选择底座模板" : "暂无底座模板"}
                              </option>
                              {buttonBaseTemplateSelectOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </label>
                          {contentType === "text" ? (
                            <label className="button-design-field">
                              <span>显示文字</span>
                              <input
                                value={state.label}
                                onChange={(event) => updateButtonStateDraft(selectedChildDraft.id, state.id, { label: event.target.value })}
                              />
                            </label>
                          ) : (
                            <div className="panel-create-pattern-layers">
                              {normalizeButtonStatePatternLayerDrafts(state).map((layer, layerIndex) => {
                                const layerFrame = getPatternLayerFrame(layer);
                                const layerCollapsed = isPatternLayerCollapsed(selectedChildDraft.id, state.id, layer.id);
                                return (
                                <article
                                  key={layer.id}
                                  className={`panel-create-pattern-layer-card ${selectedPatternLayerId === layer.id && previewStateId === state.id ? "selected" : ""} ${layerCollapsed ? "collapsed" : ""}`}
                                >
                                  <header className="panel-create-pattern-layer-card-header">
                                    <div className="panel-create-pattern-layer-card-title-row">
                                      <button
                                        type="button"
                                        className="panel-create-pattern-layer-toggle secondary"
                                        aria-expanded={!layerCollapsed}
                                        onClick={() => togglePatternLayerCollapsed(selectedChildDraft.id, state.id, layer.id)}
                                      >
                                        {layerCollapsed ? "展开" : "收起"}
                                      </button>
                                      <strong className="panel-create-pattern-layer-card-title">{layer.name}</strong>
                                      <code className="panel-create-pattern-layer-kind-badge">
                                        {layer.kind === "artText" ? "艺术字" : "图案"}
                                      </code>
                                    </div>
                                    {layerCollapsed ? (
                                      <p className="meta panel-create-pattern-layer-summary">
                                        {layer.kind === "artText"
                                          ? `文案：${layer.artTextLabel?.trim() || state.label}`
                                          : getPatternLayerTemplateSelectValue(layer)
                                            ? "已选模板"
                                            : "未选模板"}
                                        {" · "}
                                        X {layerFrame.x}% · Y {layerFrame.y}% · 字框 {layerFrame.width}%×{layerFrame.height}%
                                      </p>
                                    ) : null}
                                    <div className="panel-create-pattern-layer-card-actions">
                                      <button
                                        type="button"
                                        className="secondary"
                                        onClick={() => selectPatternLayerForPreview(selectedChildDraft.id, state.id, layer.id)}
                                      >
                                        编辑
                                      </button>
                                      {normalizeButtonStatePatternLayerDrafts(state).length > 1 ? (
                                        <button
                                          type="button"
                                          className="secondary"
                                          onClick={() => removePatternLayerDraft(selectedChildDraft.id, state.id, layer.id)}
                                        >
                                          删除
                                        </button>
                                      ) : null}
                                    </div>
                                  </header>
                                  {!layerCollapsed ? (
                                  <div className="panel-create-pattern-layer-card-body">
                                  <label className="panel-create-button-state-name-field">
                                    <span>图层名</span>
                                    <input
                                      value={layer.name}
                                      onChange={(event) => updatePatternLayers(selectedChildDraft.id, state.id, (layers) =>
                                        layers.map((candidate) =>
                                          candidate.id === layer.id ? { ...candidate, name: event.target.value } : candidate,
                                        ),
                                      )}
                                    />
                                  </label>
                                  <label className="button-design-field">
                                    <span>图层类型</span>
                                    <select
                                      value={layer.kind}
                                      onChange={(event) => updatePatternLayers(selectedChildDraft.id, state.id, (layers) =>
                                        layers.map((candidate) => {
                                          if (candidate.id !== layer.id) {
                                            return candidate;
                                          }

                                          const kind = event.target.value as ButtonPatternLayerDraft["kind"];
                                          if (kind === "artText") {
                                            return {
                                              ...createDefaultArtTextLayerDraft(layerIndex + 1, state.label),
                                              id: candidate.id,
                                              name: candidate.name,
                                            };
                                          }

                                          return {
                                            ...createEmptyPatternLayerDraft(layerIndex + 1),
                                            id: candidate.id,
                                            name: candidate.name,
                                          };
                                        }),
                                      )}
                                    >
                                      <option value="pattern">图案</option>
                                      <option value="artText">艺术字</option>
                                    </select>
                                  </label>
                                  {layer.kind === "artText" ? (
                                    <label className="button-design-field">
                                      <span>艺术字文案</span>
                                      <input
                                        value={layer.artTextLabel ?? state.label}
                                        onChange={(event) => updatePatternLayers(selectedChildDraft.id, state.id, (layers) =>
                                          layers.map((candidate) =>
                                            candidate.id === layer.id
                                              ? { ...candidate, artTextLabel: event.target.value }
                                              : candidate,
                                          ),
                                        )}
                                      />
                                    </label>
                                  ) : null}
                                  <label className="button-design-field">
                                    <span>{layer.kind === "artText" ? "艺术字图片（可选）" : "图案模板"}</span>
                                    <select
                                      value={getPatternLayerTemplateSelectValue(layer)}
                                      disabled={templatesLoading}
                                      onChange={(event) => updatePatternLayers(selectedChildDraft.id, state.id, (layers) =>
                                        layers.map((candidate) =>
                                          candidate.id === layer.id
                                            ? applyPatternLayerTemplateSelection(candidate, event.target.value)
                                            : candidate,
                                        ),
                                      )}
                                    >
                                      <option value="">
                                        {layer.kind === "artText"
                                          ? "使用 CSS 渐变艺术字"
                                          : patternTemplateSelectOptions.length > 0
                                            ? "请选择图案模板"
                                            : "暂无图案模板"}
                                      </option>
                                      {patternTemplateSelectOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </select>
                                  </label>
                                  <div className="panel-create-pattern-frame-grid">
                                    {(["x", "y", "width", "height"] as const).map((field) => (
                                      <label key={field} className="panel-create-button-state-name-field">
                                        <span>
                                          {layer.kind === "artText"
                                            ? field === "x"
                                              ? "字框 X"
                                              : field === "y"
                                                ? "字框 Y"
                                                : field === "width"
                                                  ? "字框宽"
                                                  : "字框高"
                                            : field === "x"
                                              ? "X"
                                              : field === "y"
                                                ? "Y"
                                                : field === "width"
                                                  ? "宽"
                                                  : "高"}
                                        </span>
                                        <input
                                          type="number"
                                          min={field === "x" || field === "y" ? -25 : 4}
                                          max={125}
                                          step={0.5}
                                          value={layerFrame[field]}
                                          onChange={(event) => {
                                            const nextValue = Number(event.target.value);
                                            if (!Number.isFinite(nextValue)) {
                                              return;
                                            }

                                            updatePatternLayerFrame(selectedChildDraft.id, state.id, layer.id, {
                                              ...layerFrame,
                                              [field]: nextValue,
                                            });
                                          }}
                                        />
                                      </label>
                                    ))}
                                  </div>
                                  </div>
                                  ) : null}
                                </article>
                                );
                              })}
                              <div className="panel-create-pattern-layer-add-actions">
                                <button type="button" onClick={() => addPatternLayerDraft(selectedChildDraft.id, state.id, "pattern")}>
                                  添加图案图层
                                </button>
                                <button type="button" className="secondary" onClick={() => addPatternLayerDraft(selectedChildDraft.id, state.id, "artText")}>
                                  添加艺术字图层
                                </button>
                              </div>
                              <p className="meta panel-create-art-text-hint">
                                CSS 艺术字会把文案放进可编辑的字框里：字框越大字越大。也可上传 PNG 艺术字图片替代。
                              </p>
                            </div>
                          )}
                        </section>
                        );
                      })}
                    </div>
                  </section>
                </>
              ) : (
                <section className="panel-create-form">
                  <h3>按钮设计</h3>
                  <p className="meta">请先返回美化信息并选择一个多状态按钮。</p>
                </section>
              )}
            </div>
  );
};
