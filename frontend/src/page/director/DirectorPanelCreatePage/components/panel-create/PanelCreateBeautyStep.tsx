import type { DirectorPanelCreateViewModel } from "../.././hooks/useDirectorPanelCreate.js";
import {
  getButtonPreviewStyle,
  getButtonStatePreviewClassName,
  PanelCreateChildOutline,
  renderButtonPreviewContent,
  renderButtonPreviewLayers,
  renderPanelBackgroundLayer,
} from "./panel-create-preview.js";
import { getPanelDecorationSelectValue, resolvePanelDecoration } from "../../../../../lib/director-template-select.js";
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
} from "../../../../../lib/art-text-styles.js";
import { clamp, getDecorationStyle, getPanelRenderedAspectRatio } from "../../function/panel-create-helpers.js";
import { getButtonStateContentType } from "../../function/panel-create-helpers.js";
import type { PanelChildDraft } from "../../objects/panel-create-types.js";
import type {
  TextArtGradientDirection,
  TextArtGradientIntensity,
  TextArtPreset,
} from "../../../../../objects/ui-customization/ui-customization-objects.js";
import { pagePreviewAspectRatio } from "../../objects/panel-create-types.js";

type StepProps = { vm: DirectorPanelCreateViewModel };

export const PanelCreateBeautyStep = ({ vm }: StepProps) => {
  const {
    templatesLoading,
    setStep,
    preset,
    decoration,
    setDecoration,
    panelChildDrafts,
    setSelectedChildDraftId,
    beautyPreviewCanvasRef,
    panelPreviewAspectRatio,
    selectedChildDraft,
    panelTemplateSelectOptions,
    panelTemplateMap,
    updateChildDraft,
    addSubPanelDraft,
    addMultiStateButtonDraft,
    removeChildDraft,
    moveChildDraft,
    duplicateSubPanelDraft,
    selectedChildDraftIndex,
    handleBeautyPreviewPointerDown,
    handleBeautyPreviewPointerMove,
    handleBeautyPreviewPointerUp
  } = vm;

  return (
            <div className="panel-create-beauty-layout">
              <section className="panel-create-form">
                <h3>面板模板</h3>
                <label className="button-design-field">
                  <span>面板模板</span>
                  <select
                    value={getPanelDecorationSelectValue(decoration)}
                    disabled={templatesLoading}
                    onChange={(event) => {
                      if (!event.target.value) {
                        setDecoration({
                          templateId: decoration.templateId,
                          ...(decoration.accentColor ? { accentColor: decoration.accentColor } : {}),
                        });
                        return;
                      }

                      const nextDecoration = resolvePanelDecoration(
                        event.target.value,
                        panelTemplateMap,
                        decoration.accentColor,
                      );
                      if (nextDecoration) {
                        setDecoration(nextDecoration);
                      }
                    }}
                  >
                    <option value="">
                      {panelTemplateSelectOptions.length > 0 ? "请选择模板" : "暂无模板，请先到模板库创建"}
                    </option>
                    {panelTemplateSelectOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="button-design-color-field">
                  <span>强调色</span>
                  <input
                    type="color"
                    value={decoration.accentColor ?? "#2c68a8"}
                    onChange={(event) => setDecoration({ ...decoration, accentColor: event.target.value })}
                  />
                </label>
                <div className="panel-create-tool-row">
                  <button type="button" onClick={addSubPanelDraft}>
                    添加子面板
                  </button>
                  <button type="button" onClick={addMultiStateButtonDraft}>
                    添加多状态按钮
                  </button>
                </div>
                <div className="panel-create-object-list">
                  {panelChildDrafts.length > 0 ? (
                    panelChildDrafts.map((draft) => (
                      <button
                        key={draft.id}
                        type="button"
                        className={draft.id === selectedChildDraft?.id ? "selected" : ""}
                        onClick={() => setSelectedChildDraftId(draft.id)}
                      >
                        <span>{draft.type === "multiStateButton" ? "多状态按钮" : draft.type === "subPanel" ? "子面板" : "文本"}</span>
                        <strong>{draft.type === "multiStateButton" ? draft.name : draft.type === "subPanel" ? draft.title : draft.text}</strong>
                      </button>
                    ))
                  ) : (
                    <p className="meta">当前面板还没有子对象。</p>
                  )}
                </div>

                {selectedChildDraft ? (
                  <section className="panel-create-selected-editor">
                    <div className="panel-create-selected-editor-header">
                      <h3>选中对象</h3>
                      <div className="panel-create-selected-actions">
                        <button
                          type="button"
                          className="secondary"
                          disabled={selectedChildDraftIndex <= 0}
                          onClick={() => moveChildDraft(selectedChildDraft.id, -1)}
                        >
                          上移
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          disabled={
                            selectedChildDraftIndex < 0
                            || selectedChildDraftIndex >= panelChildDrafts.length - 1
                          }
                          onClick={() => moveChildDraft(selectedChildDraft.id, 1)}
                        >
                          下移
                        </button>
                        {selectedChildDraft.type === "subPanel" ? (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => duplicateSubPanelDraft(selectedChildDraft.id)}
                          >
                            复制
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => removeChildDraft(selectedChildDraft.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <div className="panel-create-position-grid">
                      {(["x", "y", "width", "height"] as const).map((field) => (
                        <label key={field}>
                          <span>{field}</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={selectedChildDraft.position[field]}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value);
                              updateChildDraft(selectedChildDraft.id, (draft) => ({
                                ...draft,
                                position: {
                                  ...draft.position,
                                  [field]: Number.isFinite(nextValue) ? nextValue : draft.position[field],
                                },
                              } as PanelChildDraft));
                            }}
                          />
                        </label>
                      ))}
                    </div>

                    {selectedChildDraft.type === "text" ? (
                      (() => {
                        const textArtDesign = resolveTextArtDesign(selectedChildDraft.artTextDesign);
                        const textPreset = textArtDesign.preset;
                        const showGradientControls = usesTextArtGradient(textPreset);

                        return (
                      <>
                        <label className="button-design-field">
                          <span>文本</span>
                          <input
                            value={selectedChildDraft.text}
                            onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                              draft.type === "text" ? { ...draft, text: event.target.value } : draft,
                            )}
                          />
                        </label>
                        <label className="button-design-field">
                          <span>艺术字样式</span>
                          <select
                            value={textPreset}
                            onChange={(event) => {
                              const nextPreset = event.target.value as TextArtPreset;
                              updateChildDraft(selectedChildDraft.id, (draft) => {
                                if (draft.type !== "text") {
                                  return draft;
                                }

                                return {
                                  ...draft,
                                  artTextDesign: patchTextArtDesign(draft.artTextDesign, { preset: nextPreset }),
                                };
                              });
                            }}
                          >
                            {TEXT_ART_PRESET_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                        <p className="meta panel-create-art-text-hint">
                          {TEXT_ART_PRESET_OPTIONS.find((option) => option.value === textPreset)?.description
                            ?? "选择书法体或渐变艺术字样式。"}
                        </p>
                        {showGradientControls ? (
                          <>
                            <label className="button-design-field">
                              <span>渐变方向</span>
                              <select
                                value={getTextArtGradientDirection(textArtDesign)}
                                onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) => {
                                  if (draft.type !== "text") {
                                    return draft;
                                  }

                                  return {
                                    ...draft,
                                    artTextDesign: patchTextArtDesign(draft.artTextDesign, {
                                      gradientDirection: event.target.value as TextArtGradientDirection,
                                    }),
                                  };
                                })}
                              >
                                {TEXT_ART_GRADIENT_DIRECTION_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </label>
                            <label className="button-design-field">
                              <span>渐变强度</span>
                              <select
                                value={getTextArtGradientIntensity(textArtDesign)}
                                onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) => {
                                  if (draft.type !== "text") {
                                    return draft;
                                  }

                                  return {
                                    ...draft,
                                    artTextDesign: patchTextArtDesign(draft.artTextDesign, {
                                      gradientIntensity: event.target.value as TextArtGradientIntensity,
                                    }),
                                  };
                                })}
                              >
                                {TEXT_ART_GRADIENT_INTENSITY_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </label>
                            <p className="meta panel-create-art-text-hint">
                              {TEXT_ART_GRADIENT_INTENSITY_OPTIONS.find(
                                (option) => option.value === getTextArtGradientIntensity(textArtDesign),
                              )?.description ?? "控制渐变过渡的对比度。"}
                            </p>
                          </>
                        ) : null}
                        {isArtTextPreset(textPreset) ? (
                          <>
                            <label className="button-design-color-field">
                              <span>{getTextArtAccentLabel(textPreset)}</span>
                              <input
                                type="color"
                                value={getTextArtAccentColor(textArtDesign)}
                                onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) => {
                                  if (draft.type !== "text") {
                                    return draft;
                                  }

                                  return {
                                    ...draft,
                                    artTextDesign: patchTextArtDesign(draft.artTextDesign, {
                                      accentColor: event.target.value,
                                    }),
                                  };
                                })}
                              />
                            </label>
                            <p className="meta panel-create-art-text-hint">{getTextArtAccentHint(textPreset)}</p>
                          </>
                        ) : null}
                      </>
                        );
                      })()
                    ) : null}

                    {selectedChildDraft.type === "subPanel" ? (
                      <>
                        <label className="button-design-field">
                          <span>子面板名</span>
                          <input
                            value={selectedChildDraft.title}
                            onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                              draft.type === "subPanel" ? { ...draft, title: event.target.value } : draft,
                            )}
                          />
                        </label>
                        <label className="button-design-field">
                          <span>模板</span>
                          <select
                            value={getPanelDecorationSelectValue(selectedChildDraft.decoration)}
                            disabled={templatesLoading}
                            onChange={(event) => {
                              if (!event.target.value) {
                                updateChildDraft(selectedChildDraft.id, (draft) =>
                                  draft.type === "subPanel"
                                    ? {
                                        ...draft,
                                        decoration: {
                                          templateId: draft.decoration.templateId,
                                          ...(draft.decoration.accentColor
                                            ? { accentColor: draft.decoration.accentColor }
                                            : {}),
                                        },
                                      }
                                    : draft,
                                );
                                return;
                              }

                              const nextDecoration = resolvePanelDecoration(event.target.value, panelTemplateMap);
                              if (!nextDecoration) {
                                return;
                              }

                              updateChildDraft(selectedChildDraft.id, (draft) =>
                                draft.type === "subPanel" ? { ...draft, decoration: nextDecoration } : draft,
                              );
                            }}
                          >
                            <option value="">
                              {panelTemplateSelectOptions.length > 0 ? "请选择模板" : "暂无模板，请先到模板库创建"}
                            </option>
                            {panelTemplateSelectOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                      </>
                    ) : null}

                    {selectedChildDraft.type === "multiStateButton" ? (
                      <>
                        <label className="button-design-field">
                          <span>按钮名</span>
                          <input
                            value={selectedChildDraft.name}
                            onChange={(event) => updateChildDraft(selectedChildDraft.id, (draft) =>
                              draft.type === "multiStateButton" ? { ...draft, name: event.target.value } : draft,
                            )}
                          />
                        </label>
                        <button type="button" onClick={() => setStep("buttonDesign")}>
                          按钮设计
                        </button>
                      </>
                    ) : null}
                  </section>
                ) : null}
              </section>

              <section className="panel-create-preview panel-create-preview-major">
                <h3>面板预览</h3>
                <div className="panel-create-beauty-stage">
                  <div
                    className={`panel-create-beauty-preview decoration-${decoration.templateId}`}
                    style={{
                      ...getDecorationStyle(decoration),
                      aspectRatio: panelPreviewAspectRatio,
                      borderColor: decoration.accentColor,
                    }}
                  >
                    {renderPanelBackgroundLayer(decoration)}
                    <div
                      ref={beautyPreviewCanvasRef}
                      className="panel-create-beauty-canvas"
                      onPointerDown={handleBeautyPreviewPointerDown}
                      onPointerMove={handleBeautyPreviewPointerMove}
                      onPointerUp={handleBeautyPreviewPointerUp}
                      onPointerCancel={handleBeautyPreviewPointerUp}
                    >
                      {panelChildDrafts.map((draft) => {
                        const positionStyle = {
                          left: `${draft.position.x}%`,
                          top: `${draft.position.y}%`,
                          width: `${draft.position.width}%`,
                          height: `${draft.position.height}%`,
                        };
                        const selected = draft.id === selectedChildDraft?.id;
                        if (draft.type === "text") {
                          const artTextDesign = draft.artTextDesign;
                          const usesArtText = isArtTextPreset(resolveTextArtDesign(artTextDesign).preset);
                          return (
                            <div
                              key={draft.id}
                              data-panel-create-child-id={draft.id}
                              className={`panel-create-preview-text ${usesArtText ? "is-art-text" : ""} ${selected ? "selected" : ""}`.trim()}
                              style={{
                                ...positionStyle,
                                ...getPanelTextArtContainerStyle(artTextDesign),
                              }}
                            >
                              {usesArtText ? (
                                <span
                                  className={getPanelTextArtContentClassName(artTextDesign)}
                                  style={getPanelTextArtContentStyle(artTextDesign, { interactive: true })}
                                >
                                  {draft.text}
                                </span>
                              ) : draft.text}
                              {selected ? <PanelCreateChildOutline childId={draft.id} /> : null}
                            </div>
                          );
                        }
                        if (draft.type === "subPanel") {
                          return (
                            <div
                              key={draft.id}
                              data-panel-create-child-id={draft.id}
                              className={`panel-create-preview-subpanel decoration-${draft.decoration.templateId} ${selected ? "selected" : ""}`}
                              style={{
                                ...positionStyle,
                                ...getDecorationStyle(draft.decoration),
                              }}
                            >
                              {renderPanelBackgroundLayer(draft.decoration)}
                              {draft.title}
                              {selected ? (
                                <>
                                  <PanelCreateChildOutline childId={draft.id} />
                                  <div
                                    className="panel-create-preview-subpanel-actions"
                                    onPointerDown={(event) => {
                                      event.stopPropagation();
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className="secondary"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        duplicateSubPanelDraft(draft.id);
                                      }}
                                    >
                                      复制
                                    </button>
                                    <button
                                      type="button"
                                      className="secondary"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        removeChildDraft(draft.id);
                                      }}
                                    >
                                      删除
                                    </button>
                                  </div>
                                </>
                              ) : null}
                            </div>
                          );
                        }
                        const state = draft.states.find((candidate) => candidate.id === draft.defaultStateId) ?? draft.states[0];
                        if (!state) {
                          return null;
                        }

                        return (
                          <div
                            key={draft.id}
                            data-panel-create-child-id={draft.id}
                            className={`dynamic-ui-button panel-create-preview-button ${getButtonStatePreviewClassName(state)} ${selected ? "selected" : ""}`}
                            style={getButtonPreviewStyle(state, positionStyle)}
                          >
                            {renderButtonPreviewLayers(state)}
                            {renderButtonPreviewContent(state, draft.name)}
                            {selected ? <PanelCreateChildOutline childId={draft.id} /> : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            </div>
  );
};
