import type { DirectorPanelCreateViewModel } from "../../../../../hook/director-page/useDirectorPanelCreate.js";
import { PanelCreateChildOutline, renderButtonPreviewContent, renderButtonPreviewLayers, renderPanelBackgroundLayer } from "./panel-create-preview.js";
import { resolvePanelDecoration } from "../../../../../lib/director-template-select.js";
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
import { clamp, createDefaultPanelChildDrafts, getDecorationStyle, getPanelRenderedAspectRatio } from "../../../../../lib/director-page/panel-create-helpers.js";
import { getButtonStateContentType } from "../../../../../lib/director-page/panel-create-helpers.js";
import type { PanelPreset } from "../../../../../objects/director-page/panel-create-types.js";
import { pagePreviewAspectRatio } from "../../../../../objects/director-page/panel-create-types.js";

type StepProps = { vm: DirectorPanelCreateViewModel };

export const PanelCreateBasicStep = ({ vm }: StepProps) => {
  const {
    setPanelPickerOpen,
    preset,
    setPreset,
    panelTitle,
    setPanelTitle,
    idSeed,
    setIdSeed,
    panelPosition,
    setDecoration,
    setPanelChildDrafts,
    setSelectedChildDraftId,
    selectedParentPanel,
    parentAspectRatio,
    parentContentSize,
    startMovePanel,
    startResizePanel,
    handlePanelPointerMove,
    stopPanelPointer,
    getPanelDisplayName
  } = vm;

  return (
            <div className="panel-create-basic-layout">
              <section className="panel-create-form">
                <h3>显示的父界面</h3>
                <div className="page-builder-current-panel panel-create-parent-card">
                  <span>小面板会挂在这个父界面下，关卡界面可以作为父界面，按钮不能作为父界面。</span>
                  <div>
                    <code>{selectedParentPanel ? getPanelDisplayName(selectedParentPanel) : "未选择"}</code>
                    <button type="button" className="secondary" onClick={() => setPanelPickerOpen(true)}>
                      修改
                    </button>
                  </div>
                </div>
                <label className="button-design-field">
                  <span>用途模板</span>
                  <select
                    value={preset}
                    onChange={(event) => {
                      const nextPreset = event.target.value as PanelPreset;
                        setPreset(nextPreset);
                      if (nextPreset === "checkIn") {
                        setPanelTitle("每周签到");
                        setIdSeed("check-in");
                        setDecoration({ templateId: "reward", accentColor: "#2c68a8" });
                        setPanelChildDrafts(createDefaultPanelChildDrafts());
                        setSelectedChildDraftId("day1");
                      } else {
                        setPanelTitle("空白小面板");
                        setIdSeed("custom-panel");
                        setDecoration({ templateId: "plain", accentColor: "#2c68a8" });
                        setPanelChildDrafts([]);
                        setSelectedChildDraftId("");
                      }
                    }}
                  >
                    <option value="checkIn">签到小面板</option>
                    <option value="blank">空白小面板</option>
                  </select>
                </label>
                <label className="button-design-field">
                  <span>面板名称</span>
                  <input value={panelTitle} onChange={(event) => setPanelTitle(event.target.value)} />
                </label>
                <label className="button-design-field">
                  <span>ID 前缀</span>
                  <input value={idSeed} onChange={(event) => setIdSeed(event.target.value)} />
                </label>
                <div className="panel-create-position-readout">
                  <span>相对位置</span>
                  <code>
                    x {panelPosition.x.toFixed(1)} · y {panelPosition.y.toFixed(1)} · w {panelPosition.width.toFixed(1)} · h {panelPosition.height.toFixed(1)}
                  </code>
                </div>
              </section>

              <section className="panel-create-preview wide">
                <h3>框选相对位置</h3>
                <div
                  className="panel-create-parent-preview"
                  onPointerMove={handlePanelPointerMove}
                  onPointerUp={stopPanelPointer}
                  onPointerCancel={stopPanelPointer}
                >
                  <div
                    className={`panel-create-parent-viewport ${parentContentSize ? "scroll-parent" : ""}`}
                    style={{ aspectRatio: parentAspectRatio }}
                  >
                    <div className="panel-create-parent-label">
                      <strong>{selectedParentPanel ? getPanelDisplayName(selectedParentPanel) : "父界面"}</strong>
                      <code>{selectedParentPanel?.id ?? "-"}</code>
                      {parentContentSize ? (
                        <span>
                          可滚动内容 {parentContentSize.widthPercent.toFixed(0)}% x {parentContentSize.heightPercent.toFixed(0)}%
                        </span>
                      ) : null}
                    </div>
                    {parentContentSize ? (
                      <div
                        className="panel-create-scroll-content-outline"
                        style={{
                          width: `${parentContentSize.widthPercent}%`,
                          height: `${parentContentSize.heightPercent}%`,
                        }}
                      >
                        <span>滚动内容范围</span>
                      </div>
                    ) : null}
                    <div
                      className="panel-create-frame"
                      style={{
                        left: `${panelPosition.x}%`,
                        top: `${panelPosition.y}%`,
                        width: `${panelPosition.width}%`,
                        height: `${panelPosition.height}%`,
                      }}
                      onPointerDown={startMovePanel}
                      onPointerUp={stopPanelPointer}
                      onPointerCancel={stopPanelPointer}
                    >
                      <strong>{panelTitle || "小面板"}</strong>
                      <span>拖动移动，拉角调整大小</span>
                      {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((handle) => (
                        <span
                          key={handle}
                          className={`panel-create-frame-handle ${handle}`}
                          onPointerDown={startResizePanel(handle)}
                          onPointerUp={stopPanelPointer}
                          onPointerCancel={stopPanelPointer}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
  );
};
