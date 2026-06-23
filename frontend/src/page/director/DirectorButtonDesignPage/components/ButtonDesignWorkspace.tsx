import type { ButtonDesignViewModel } from "../../../../hook/director-page/useDirectorButtonDesign.js";
import {
  getButtonBaseDesignStyle,
  getButtonImageDesignStyle,
  getButtonTextScaleStyle,
} from "../../../../component/ui-renderer/ui-renderer-utils.js";
import {
  buttonDesignPreviewHeightPx,
  defaultRenderWhiteTolerance,
  defaultWhiteTolerance,
} from "../../../../objects/director-page/button-design-types.js";
import { ButtonDesignImageCropPanel } from "./ButtonDesignImageCropPanel.js";

type ButtonDesignWorkspaceProps = {
  design: ButtonDesignViewModel;
  onBack: () => void;
};

export const ButtonDesignWorkspace = ({ design, onBack }: ButtonDesignWorkspaceProps) => {
  const { selectedButton } = design;

  return (
    <>
      <div className="page-builder-toolbar">
        <div>
          <p className="eyebrow">Button Design</p>
          <h2>按钮美化</h2>
          <p className="panel-copy">当前阶段先处理文本按钮，后续再进入图片折线截取和曲线截取。</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={onBack}>
            返回页面优化
          </button>
          <button type="button" disabled={!selectedButton} onClick={design.handleSave}>
            保存按钮美化
          </button>
        </div>
      </div>

      {!design.pageId ? <p className="feedback error">缺少 pageId，无法进入按钮美化。</p> : null}
      {design.pageId && !design.pageConfig ? <p className="feedback error">该页面配置不存在。</p> : null}
      {design.pageConfig && !selectedButton ? <p className="feedback error">当前组件不是按钮，无法美化。</p> : null}
      {design.feedback ? <p className="feedback">{design.feedback}</p> : null}

      {selectedButton ? (
      <div className="button-design-layout">
        <section className="button-design-controls">
          <h3>类型</h3>
          <label className="button-design-field">
            <span>上层内容</span>
            <select
              value={design.designType}
              onChange={(event) => {
                design.setDesignType(event.target.value as typeof design.designType);
                design.clearFeedback();
              }}
            >
              <option value="text">文本</option>
              <option value="image">图案</option>
            </select>
          </label>
        </section>

        {design.designType === "text" ? (
          <section className="button-design-text-panel">
            <h3>文本内容</h3>
            <label className="button-design-field">
              <span>显示文本</span>
              <input
                type="text"
                value={design.draftLabel}
                onChange={(event) => {
                  design.setDraftLabel(event.target.value);
                  design.clearFeedback();
                }}
                placeholder="输入按钮文字"
              />
            </label>
            <label className="button-design-slider">
              <span>文本占比</span>
              <input
                type="range"
                min={20}
                max={80}
                value={design.draftTextScalePercent}
                onChange={(event) => {
                  design.setDraftTextScalePercent(Number(event.target.value));
                  design.clearFeedback();
                }}
              />
              <code>{design.draftTextScalePercent}%</code>
            </label>
          </section>
        ) : null}

        {design.designType === "image" ? (
          <ButtonDesignImageCropPanel design={design} />
        ) : null}

        <section className="button-design-color-panel">
          <h3>纯色底座</h3>
          <label className="button-design-color-field">
            <span>按钮颜色</span>
            <input
              type="color"
              value={design.draftBackgroundColor}
              onChange={(event) => {
                design.setDraftBackgroundColor(event.target.value);
                design.clearFeedback();
              }}
            />
            <code>{design.draftBackgroundColor}</code>
          </label>
          <label className="button-design-color-field">
            <span>文字颜色</span>
            <input
              type="color"
              value={design.draftTextColor}
              onChange={(event) => {
                design.setDraftTextColor(event.target.value);
                design.clearFeedback();
              }}
            />
            <code>{design.draftTextColor}</code>
          </label>
        </section>

        <section className="button-design-template-panel">
          <h3>底座模板</h3>
          <label className="button-design-field">
            <span>底座选择</span>
            <select
              value={design.templateChoice}
              onChange={(event) => {
                design.handleTemplateChoiceChange(event.target.value);
              }}
            >
              <option value="custom">纯色底座</option>
              {design.buttonTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          {design.selectedBaseDesign ? (
            <p className="meta">
              {design.selectedBaseDesign.scalingMode === "nineSlice"
                ? "当前底座为可压缩模板。"
                : "当前底座为不可压缩模板，按钮宽高比例由底座图片锁定。"}
            </p>
          ) : null}
        </section>

        <section className="button-design-preview-panel">
          <h3>按钮预览</h3>
          <button
            type="button"
            className={`dynamic-ui-button button-design-live-preview ${selectedButton.style?.variant ?? "primary"} ${design.designType === "image" ? "layout-editing" : ""}`}
            onPointerMove={design.designType === "image" ? design.handlePreviewFramePointerMove : undefined}
            onPointerUp={design.designType === "image" ? design.handlePreviewFramePointerEnd : undefined}
            onPointerCancel={design.designType === "image" ? design.handlePreviewFramePointerEnd : undefined}
            style={{
              backgroundColor: design.selectedBaseDesign ? "#ffffff" : design.draftBackgroundColor,
              color: design.draftTextColor,
              ...(design.designType === "image" || design.isFixedAspectTemplate
                ? { width: `${buttonDesignPreviewHeightPx * design.buttonAspectRatio}px` }
                : {}),
              ...getButtonTextScaleStyle(selectedButton.position, {
                ...selectedButton.style,
                textScalePercent: design.draftTextScalePercent,
              }),
              ...(design.selectedBaseDesign
                ? { borderRadius: 0, borderColor: "transparent", padding: 0 }
                : typeof selectedButton.style?.borderRadius === "number"
                  ? { borderRadius: `${selectedButton.style.borderRadius}px` }
                  : {}),
            }}
          >
            {design.selectedBaseDesign ? (
              <span
                className="dynamic-ui-button-base"
                style={getButtonBaseDesignStyle(design.selectedBaseDesign)}
                aria-hidden="true"
              >
                {design.selectedBaseDesign.scalingMode === "fixedAspect" ? (
                  <img src={design.selectedBaseDesign.sourceDataUrl} alt="" />
                ) : null}
              </span>
            ) : null}
            {design.designType === "image" && design.outputDataUrl ? (
              <span
                className="dynamic-ui-button-image"
                style={getButtonImageDesignStyle({
                  sourceDataUrl: design.imageSourceDataUrl,
                  outputDataUrl: design.outputDataUrl,
                  imageFrame: design.imageFrame,
                  polygonPoints: design.polygonPoints,
                  whiteTolerance: defaultWhiteTolerance,
                  renderWhiteTolerance: defaultRenderWhiteTolerance,
                })}
                aria-hidden="true"
              />
            ) : null}
            {design.designType === "text" || !design.outputDataUrl ? (
              <span className="dynamic-ui-button-content">
                {selectedButton.icon ? <span className="dynamic-ui-button-icon">{selectedButton.icon}</span> : null}
                <span>{design.draftLabel.trim() || selectedButton.label}</span>
              </span>
            ) : null}
            {design.designType === "image" ? (
              <span className="button-design-button-frame">
                {design.isFixedAspectTemplate
                  ? null
                  : (["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((corner) => (
                      <span
                        key={corner}
                        className={`button-design-frame-handle ${corner}`}
                        onPointerDown={design.handlePreviewFramePointerDown("button", corner)}
                      />
                    ))}
              </span>
            ) : null}
            {design.designType === "image" ? (
              <span
                className="button-design-image-frame"
                style={{
                  left: `${design.imageFrame.x}%`,
                  top: `${design.imageFrame.y}%`,
                  width: `${design.imageFrame.width}%`,
                  height: `${design.imageFrame.height}%`,
                }}
              >
                {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((corner) => (
                  <span
                    key={corner}
                    className={`button-design-frame-handle ${corner}`}
                    onPointerDown={design.handlePreviewFramePointerDown("image", corner)}
                  />
                ))}
              </span>
            ) : null}
          </button>
          {design.designType === "image" ? (
            <p className="meta">
              {design.isFixedAspectTemplate
                ? "不可压缩模板下按钮比例已锁定，可拖动内框角点调整图案位置。"
                : "拖动外框角点调整按钮比例，拖动内框角点调整图案位置。"}
            </p>
          ) : null}
        </section>
      </div>
      ) : null}
    </>
  );
};
