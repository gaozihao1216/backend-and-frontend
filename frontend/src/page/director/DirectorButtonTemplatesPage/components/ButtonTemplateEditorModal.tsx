import type { ClipboardEvent, CSSProperties, PointerEvent } from "react";
import {
  BUTTON_TEMPLATE_CATEGORIES,
  type ButtonTemplateCategory,
} from "../../../../objects/ui/category/template-category.js";
import type { EditorMode, SliceKey, TemplateDraft } from "../../../../objects/director-page/button-template-types.js";
import type { UiButtonTemplate } from "../../../../api/api-contracts.js";

type ButtonTemplateEditorModalProps = {
  editorMode: EditorMode;
  draft: TemplateDraft;
  selectedTemplate: UiButtonTemplate | null;
  pastedImageValue: string;
  isNineSliceMode: boolean;
  previewImageSize: { width: number; height: number };
  saving: boolean;
  saveError: string;
  onDraftChange: (updater: (current: TemplateDraft) => TemplateDraft) => void;
  onPastedImageValueChange: (value: string) => void;
  onImageUpload: (file: File | undefined) => void;
  onPasteImage: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  onLoadPastedImage: () => void;
  onSlicePointerDown: (key: SliceKey) => (event: PointerEvent<HTMLButtonElement>) => void;
  onSlicePointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onSlicePointerEnd: (event: PointerEvent<HTMLDivElement>) => void;
  getVerticalSlicePercent: (key: "left" | "right") => number;
  getHorizontalSlicePercent: (key: "top" | "bottom") => number;
  visibleBoundsStyle: CSSProperties;
  onClose: () => void;
  onSave: () => void;
};

export const ButtonTemplateEditorModal = ({
  editorMode,
  draft,
  selectedTemplate,
  pastedImageValue,
  isNineSliceMode,
  previewImageSize,
  saving,
  saveError,
  onDraftChange,
  onPastedImageValueChange,
  onImageUpload,
  onPasteImage,
  onLoadPastedImage,
  onSlicePointerDown,
  onSlicePointerMove,
  onSlicePointerEnd,
  getVerticalSlicePercent,
  getHorizontalSlicePercent,
  visibleBoundsStyle,
  onClose,
  onSave,
}: ButtonTemplateEditorModalProps) => (
  <div className="button-template-modal" role="dialog" aria-modal="true">
    <section className="button-template-editor">
      <div className="mini-card-header">
        <div>
          <h3>{editorMode === "create" ? "新增按钮模板" : "修改按钮模板"}</h3>
          <p className="panel-copy">
            {selectedTemplate ? `正在编辑：${selectedTemplate.name}` : "上传图片后会自动把纯白背景转为透明。"}
          </p>
        </div>
        <button type="button" className="secondary" onClick={onClose}>
          关闭
        </button>
      </div>

      {saveError ? <p className="feedback error">{saveError}</p> : null}

      <div className="button-template-editor-layout">
        <section className="button-template-editor-form">
          <label className="button-design-field">
            <span>模板 ID</span>
            <input
              value={draft.id}
              disabled={editorMode === "update"}
              onChange={(event) => onDraftChange((current) => ({ ...current, id: event.target.value }))}
            />
          </label>
          <label className="button-design-field">
            <span>模板名称</span>
            <input
              value={draft.name}
              onChange={(event) => onDraftChange((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="button-design-field">
            <span>模板分类</span>
            <select
              value={draft.category}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...current,
                  category: event.target.value as ButtonTemplateCategory,
                }))
              }
            >
              {BUTTON_TEMPLATE_CATEGORIES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="button-design-field">
            <span>缩放方式</span>
            <select
              value={draft.scalingMode}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...current,
                  scalingMode: event.target.value as TemplateDraft["scalingMode"],
                }))
              }
            >
              <option value="fixedAspect">不可压缩</option>
              <option value="nineSlice">可压缩</option>
            </select>
          </label>
          <label className="button-design-file-drop">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => void onImageUpload(event.target.files?.[0])}
            />
            <strong>上传模板图片</strong>
            <span>建议使用白底或透明背景按钮图。</span>
          </label>
          <label className="button-template-paste-field">
            <span>粘贴图片</span>
            <textarea
              value={pastedImageValue}
              placeholder="在这里 Ctrl+V 粘贴图片，或粘贴 data:image/... 文本"
              onPaste={(event) => void onPasteImage(event)}
              onChange={(event) => onPastedImageValueChange(event.target.value)}
            />
          </label>
          <button type="button" className="secondary" onClick={() => void onLoadPastedImage()}>
            载入粘贴图片
          </button>
          {isNineSliceMode ? (
            <div className="button-template-slice-readout">
              <span>上分割线 {draft.slice.top}px</span>
              <span>右分割线 {draft.slice.right}px</span>
              <span>下分割线 {draft.slice.bottom}px</span>
              <span>左分割线 {draft.slice.left}px</span>
            </div>
          ) : (
            <p className="meta">不可压缩模板会锁定按钮比例，不使用九宫格切片。</p>
          )}
        </section>

        <section className="button-template-editor-preview">
          <h4>模板预览</h4>
          <div className="button-template-large-preview">
            <div
              className="button-template-nine-slice-frame"
              style={{ aspectRatio: `${previewImageSize.width} / ${previewImageSize.height}` }}
            >
              <img src={draft.sourceDataUrl} alt={draft.name} />
              {isNineSliceMode ? (
                <div
                  className="button-template-nine-slice"
                  style={visibleBoundsStyle}
                  aria-hidden="true"
                  onPointerMove={onSlicePointerMove}
                  onPointerUp={onSlicePointerEnd}
                  onPointerCancel={onSlicePointerEnd}
                >
                  <button
                    type="button"
                    className="button-template-slice-line horizontal top"
                    style={{ top: `${getHorizontalSlicePercent("top")}%` }}
                    onPointerDown={onSlicePointerDown("top")}
                  />
                  <button
                    type="button"
                    className="button-template-slice-line horizontal bottom"
                    style={{ top: `${getHorizontalSlicePercent("bottom")}%` }}
                    onPointerDown={onSlicePointerDown("bottom")}
                  />
                  <button
                    type="button"
                    className="button-template-slice-line vertical left"
                    style={{ left: `${getVerticalSlicePercent("left")}%` }}
                    onPointerDown={onSlicePointerDown("left")}
                  />
                  <button
                    type="button"
                    className="button-template-slice-line vertical right"
                    style={{ left: `${getVerticalSlicePercent("right")}%` }}
                    onPointerDown={onSlicePointerDown("right")}
                  />
                </div>
              ) : (
                <div className="button-template-visible-bounds" style={visibleBoundsStyle} aria-hidden="true" />
              )}
            </div>
          </div>
          <p className="meta">
            {isNineSliceMode
              ? "外框由图案可见边界自动识别；拖动内部四条线调整九宫格切片。"
              : "外框由图案可见边界自动识别；不可压缩模板会按该图案比例使用。"}
          </p>
          <div className="button-template-preview-row">
            <button type="button" className="button-template-sample">
              <img src={draft.sourceDataUrl} alt="" />
              <span>模板按钮</span>
            </button>
            <button type="button" className="button-template-sample wide">
              <img src={draft.sourceDataUrl} alt="" />
              <span>宽按钮</span>
            </button>
          </div>
        </section>
      </div>

      <div className="button-template-editor-actions">
        <button type="button" className="secondary" onClick={onClose}>
          取消
        </button>
        <button type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? "保存中..." : "保存模板"}
        </button>
      </div>
    </section>
  </div>
);
