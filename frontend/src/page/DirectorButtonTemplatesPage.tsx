import { useEffect, useMemo, useState, type ClipboardEvent, type PointerEvent } from "react";
import {
  createButtonTemplate,
  deleteButtonTemplate,
  listButtonTemplates,
  updateButtonTemplate,
} from "../api/index.js";
import type { UiButtonTemplate } from "../api/api-contracts.js";
import { SimpleStretchTemplateSection } from "../component/director/SimpleStretchTemplateSection.js";
import { TemplateCategoryFilter } from "../component/director/TemplateCategoryFilter.js";
import { processTemplateImage, readFileAsDataUrl } from "../lib/template-image-utils.js";
import {
  BUTTON_TEMPLATE_CATEGORIES,
  DEFAULT_BUTTON_TEMPLATE_CATEGORY,
  getButtonTemplateCategoryLabel,
  normalizeButtonTemplateCategory,
  type ButtonTemplateCategory,
} from "../objects/ui-customization/template-category.js";

type DirectorButtonTemplatesPageProps = {
  userId: string;
  onBack: () => void;
};

type TemplateTab = "button" | "panel" | "pattern";

type EditorMode = "create" | "update";

type TemplateDraft = {
  id: string;
  name: string;
  sourceDataUrl: string;
  category: ButtonTemplateCategory;
  scalingMode: "fixedAspect" | "nineSlice";
  slice: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

type SliceKey = keyof TemplateDraft["slice"];
type ImageSize = {
  width: number;
  height: number;
};
type ImageBounds = ImageSize & {
  x: number;
  y: number;
};

const defaultTemplateDataUrl = (() => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="144" viewBox="0 0 360 144">
      <defs>
        <linearGradient id="button" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#7dd3fc"/>
          <stop offset="0.52" stop-color="#2563eb"/>
          <stop offset="1" stop-color="#1e3a8a"/>
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="340" height="124" rx="34" fill="url(#button)"/>
      <path d="M42 25h276c18 0 30 12 30 30v6H12v-6c0-18 12-30 30-30z" fill="rgba(255,255,255,0.28)"/>
      <path d="M42 126h276c18 0 30-12 30-30v-10H12v10c0 18 12 30 30 30z" fill="rgba(15,23,42,0.2)"/>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
})();

const defaultPanelTemplateDataUrl = (() => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="420" height="280" viewBox="0 0 420 280">
      <rect x="12" y="12" width="396" height="256" rx="28" fill="#ffffff" stroke="#94a3b8" stroke-width="8"/>
      <rect x="28" y="28" width="364" height="56" rx="16" fill="#dbeafe"/>
      <rect x="28" y="96" width="364" height="156" rx="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
})();

const defaultPatternTemplateDataUrl = (() => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="56" fill="#fde68a" stroke="#f59e0b" stroke-width="8"/>
      <path d="M80 34l12 28h29l-23 18 9 29-27-17-27 17 9-29-23-18h29z" fill="#f97316"/>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
})();

const templateTabs: Array<{ id: TemplateTab; label: string }> = [
  { id: "button", label: "按钮模板" },
  { id: "panel", label: "面板模板" },
  { id: "pattern", label: "图案模板" },
];

const createDefaultDraft = (): TemplateDraft => ({
  id: `button-template-${Date.now()}`,
  name: "新按钮模板",
  sourceDataUrl: defaultTemplateDataUrl,
  category: DEFAULT_BUTTON_TEMPLATE_CATEGORY,
  scalingMode: "fixedAspect",
  slice: {
    top: 24,
    right: 24,
    bottom: 24,
    left: 24,
  },
});

const createDraftFromTemplate = (template: UiButtonTemplate): TemplateDraft => ({
  id: template.id,
  name: template.name,
  sourceDataUrl: template.sourceDataUrl,
  category: normalizeButtonTemplateCategory(template.category),
  scalingMode: template.scalingMode,
  slice: { ...template.slice },
});

const createTemplateFromDraft = (draft: TemplateDraft): UiButtonTemplate => ({
  id: draft.id.trim(),
  name: draft.name.trim(),
  sourceDataUrl: draft.sourceDataUrl,
  category: draft.category,
  scalingMode: draft.scalingMode,
  slice: {
    top: Number.isFinite(draft.slice.top) ? draft.slice.top : 0,
    right: Number.isFinite(draft.slice.right) ? draft.slice.right : 0,
    bottom: Number.isFinite(draft.slice.bottom) ? draft.slice.bottom : 0,
    left: Number.isFinite(draft.slice.left) ? draft.slice.left : 0,
  },
});

const templateBackgroundTolerance = 22;

const isTemplateBackgroundPixel = (red: number, green: number, blue: number, alpha: number): boolean =>
  alpha <= 8
  || (
    red >= 255 - templateBackgroundTolerance
    && green >= 255 - templateBackgroundTolerance
    && blue >= 255 - templateBackgroundTolerance
  );

const detectVisibleImageBounds = async (dataUrl: string): Promise<{ imageSize: ImageSize; bounds: ImageBounds }> => {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  const imageSize = {
    width: image.naturalWidth || 1,
    height: image.naturalHeight || 1,
  };
  const canvas = document.createElement("canvas");
  canvas.width = imageSize.width;
  canvas.height = imageSize.height;
  const context = canvas.getContext("2d");
  if (!context) {
    return {
      imageSize,
      bounds: {
        x: 0,
        y: 0,
        width: imageSize.width,
        height: imageSize.height,
      },
    };
  }

  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4;
      const red = pixels[index] ?? 0;
      const green = pixels[index + 1] ?? 0;
      const blue = pixels[index + 2] ?? 0;
      const alpha = pixels[index + 3] ?? 0;
      if (!isTemplateBackgroundPixel(red, green, blue, alpha)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return {
      imageSize,
      bounds: {
        x: 0,
        y: 0,
        width: imageSize.width,
        height: imageSize.height,
      },
    };
  }

  return {
    imageSize,
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    },
  };
};

export const DirectorButtonTemplatesPage = ({ userId, onBack }: DirectorButtonTemplatesPageProps) => {
  const [activeTab, setActiveTab] = useState<TemplateTab>("button");
  const [templates, setTemplates] = useState<UiButtonTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [draft, setDraft] = useState<TemplateDraft>(() => createDefaultDraft());
  const [pastedImageValue, setPastedImageValue] = useState("");
  const [previewImageSize, setPreviewImageSize] = useState<ImageSize>({ width: 360, height: 144 });
  const [previewImageBounds, setPreviewImageBounds] = useState<ImageBounds>({
    x: 0,
    y: 0,
    width: 360,
    height: 144,
  });
  const [draggingSlice, setDraggingSlice] = useState<SliceKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ButtonTemplateCategory | "all">("all");

  const filteredTemplates = useMemo(
    () => categoryFilter === "all"
      ? templates
      : templates.filter((template) => normalizeButtonTemplateCategory(template.category) === categoryFilter),
    [categoryFilter, templates],
  );

  const selectedTemplate = useMemo(
    () => editorMode === "update" ? templates.find((template) => template.id === draft.id) ?? null : null,
    [draft.id, editorMode, templates],
  );
  const isNineSliceMode = draft.scalingMode === "nineSlice";

  const loadTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      setTemplates(await listButtonTemplates(userId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "按钮模板加载失败。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    detectVisibleImageBounds(draft.sourceDataUrl)
      .then(({ imageSize, bounds }) => {
        if (cancelled) {
          return;
        }

        setPreviewImageSize(imageSize);
        setPreviewImageBounds(bounds);
        setDraft((current) => ({
          ...current,
          slice: {
            top: Math.min(current.slice.top, bounds.height),
            right: Math.min(current.slice.right, bounds.width),
            bottom: Math.min(current.slice.bottom, bounds.height),
            left: Math.min(current.slice.left, bounds.width),
          },
        }));
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewImageBounds({
            x: 0,
            y: 0,
            width: previewImageSize.width,
            height: previewImageSize.height,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [draft.sourceDataUrl]);

  const openCreateEditor = () => {
    setDraft(createDefaultDraft());
    setPastedImageValue("");
    setEditorMode("create");
    setMessage("");
    setError("");
  };

  const openUpdateEditor = (template: UiButtonTemplate) => {
    setDraft(createDraftFromTemplate(template));
    setPastedImageValue("");
    setEditorMode("update");
    setMessage("");
    setError("");
  };

  const applyTemplateImage = async (dataUrl: string) => {
    const processedDataUrl = await processTemplateImage(dataUrl);
    setDraft((current) => ({
      ...current,
      sourceDataUrl: processedDataUrl,
    }));
    setPastedImageValue(dataUrl.startsWith("data:image/") ? dataUrl : "");
  };

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      const rawDataUrl = await readFileAsDataUrl(file);
      await applyTemplateImage(rawDataUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "图片处理失败。");
    }
  };

  const handlePasteImage = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItem = [...event.clipboardData.items].find((item) => item.type.startsWith("image/"));
    const imageFile = imageItem?.getAsFile();
    if (!imageFile) {
      return;
    }

    event.preventDefault();
    try {
      const rawDataUrl = await readFileAsDataUrl(imageFile);
      await applyTemplateImage(rawDataUrl);
      setError("");
    } catch (pasteError) {
      setError(pasteError instanceof Error ? pasteError.message : "剪贴板图片处理失败。");
    }
  };

  const handleLoadPastedImage = async () => {
    const value = pastedImageValue.trim();
    if (!value.startsWith("data:image/")) {
      setError("请粘贴 data:image/... 格式的图片文本，或直接在文本框中 Ctrl+V 粘贴图片。");
      return;
    }

    try {
      await applyTemplateImage(value);
      setError("");
    } catch (pasteError) {
      setError(pasteError instanceof Error ? pasteError.message : "粘贴图片处理失败。");
    }
  };

  const clampSliceValue = (key: SliceKey, value: number): number => {
    const maxValue = key === "top" || key === "bottom" ? previewImageBounds.height : previewImageBounds.width;
    return Math.round(Math.min(maxValue, Math.max(0, value)));
  };

  const updateSlice = (key: SliceKey, value: number) => {
    setDraft((current) => ({
      ...current,
      slice: {
        ...current.slice,
        [key]: clampSliceValue(key, value),
      },
    }));
  };

  const handleSlicePointerDown = (key: SliceKey) => (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDraggingSlice(key);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSlicePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingSlice) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    if (draggingSlice === "top") {
      updateSlice("top", ((event.clientY - rect.top) / rect.height) * previewImageBounds.height);
      return;
    }
    if (draggingSlice === "bottom") {
      updateSlice("bottom", ((rect.bottom - event.clientY) / rect.height) * previewImageBounds.height);
      return;
    }
    if (draggingSlice === "left") {
      updateSlice("left", ((event.clientX - rect.left) / rect.width) * previewImageBounds.width);
      return;
    }
    updateSlice("right", ((rect.right - event.clientX) / rect.width) * previewImageBounds.width);
  };

  const handleSlicePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    setDraggingSlice(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const getVerticalSlicePercent = (key: "left" | "right") => {
    const value = draft.slice[key];
    const percent = previewImageBounds.width > 0 ? (value / previewImageBounds.width) * 100 : 0;
    return key === "left" ? percent : 100 - percent;
  };

  const getHorizontalSlicePercent = (key: "top" | "bottom") => {
    const value = draft.slice[key];
    const percent = previewImageBounds.height > 0 ? (value / previewImageBounds.height) * 100 : 0;
    return key === "top" ? percent : 100 - percent;
  };

  const getVisibleBoundsStyle = () => ({
    left: `${(previewImageBounds.x / previewImageSize.width) * 100}%`,
    top: `${(previewImageBounds.y / previewImageSize.height) * 100}%`,
    width: `${(previewImageBounds.width / previewImageSize.width) * 100}%`,
    height: `${(previewImageBounds.height / previewImageSize.height) * 100}%`,
  });

  const handleSave = async () => {
    if (!editorMode) {
      return;
    }

    const template = createTemplateFromDraft(draft);
    if (!template.id || !template.name || !template.sourceDataUrl) {
      setError("模板 ID、名称和图片不能为空。");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const savedTemplate = editorMode === "create"
        ? await createButtonTemplate(userId, template)
        : await updateButtonTemplate(userId, template.id, template);
      setTemplates((current) => {
        const exists = current.some((item) => item.id === savedTemplate.id);
        return exists
          ? current.map((item) => item.id === savedTemplate.id ? savedTemplate : item)
          : [...current, savedTemplate].sort((left, right) => left.id.localeCompare(right.id));
      });
      setEditorMode(null);
      setMessage(editorMode === "create" ? "按钮模板已新增。" : "按钮模板已更新。");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "按钮模板保存失败。");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: UiButtonTemplate) => {
    const confirmed = window.confirm(`确认删除按钮模板“${template.name}”？`);
    if (!confirmed) {
      return;
    }

    setError("");
    try {
      await deleteButtonTemplate(userId, template.id);
      setTemplates((current) => current.filter((item) => item.id !== template.id));
      setMessage("按钮模板已删除。");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "按钮模板删除失败。");
    }
  };

  return (
    <section className="panel button-template-page">
      <div className="feature-header">
        <div>
          <h2>模板库</h2>
          <p className="panel-copy">管理按钮、面板与图案模板。按钮模板支持九宫格压缩；面板与图案模板统一采用整体拉伸。</p>
        </div>
        <div className="director-ui-header-actions">
          <button type="button" className="secondary" onClick={onBack}>
            返回 UI 美化配置
          </button>
          {activeTab === "button" ? (
            <button type="button" onClick={openCreateEditor}>
              新增按钮模板
            </button>
          ) : null}
        </div>
      </div>

      <div className="director-template-tabs" role="tablist" aria-label="模板类型">
        {templateTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "selected" : ""}
            onClick={() => {
              setActiveTab(tab.id);
              setMessage("");
              setError("");
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "panel" ? (
        <SimpleStretchTemplateSection
          userId={userId}
          kind="panel"
          title="面板模板"
          description="用于面板背景与装饰，统一设为可压缩，采用整体拉伸缩放。"
          idPrefix="panel-template"
          defaultName="新面板模板"
          defaultDataUrl={defaultPanelTemplateDataUrl}
        />
      ) : null}

      {activeTab === "pattern" ? (
        <SimpleStretchTemplateSection
          userId={userId}
          kind="pattern"
          title="图案模板"
          description="用于按钮图案与图标装饰，统一设为可压缩，采用整体拉伸缩放。"
          idPrefix="pattern-template"
          defaultName="新图案模板"
          defaultDataUrl={defaultPatternTemplateDataUrl}
        />
      ) : null}

      {activeTab !== "button" ? null : (
        <>
      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      <TemplateCategoryFilter
        categories={BUTTON_TEMPLATE_CATEGORIES}
        activeCategory={categoryFilter}
        onChange={setCategoryFilter}
      />

      {loading ? (
        <p className="meta">正在读取按钮模板...</p>
      ) : filteredTemplates.length > 0 ? (
        <div className="button-template-grid">
          {filteredTemplates.map((template) => (
            <article key={template.id} className="button-template-card">
              <div className="button-template-preview">
                <img src={template.sourceDataUrl} alt={template.name} />
              </div>
              <div className="button-template-card-body">
                <div>
                  <strong>{template.name}</strong>
                  <p className="meta">{template.id}</p>
                  <p className="template-category-badge">
                    {getButtonTemplateCategoryLabel(normalizeButtonTemplateCategory(template.category))}
                  </p>
                  <p className="meta">{template.scalingMode === "nineSlice" ? "可压缩模板" : "不可压缩模板"}</p>
                </div>
                <div className="button-template-card-actions">
                  <button type="button" className="secondary" onClick={() => openUpdateEditor(template)}>
                    修改
                  </button>
                  <button type="button" className="secondary danger" onClick={() => void handleDelete(template)}>
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="button-template-empty">
          <p>暂无按钮模板。</p>
          <button type="button" onClick={openCreateEditor}>
            新增第一个模板
          </button>
        </section>
      )}

      {editorMode ? (
        <div className="button-template-modal" role="dialog" aria-modal="true">
          <section className="button-template-editor">
            <div className="mini-card-header">
              <div>
                <h3>{editorMode === "create" ? "新增按钮模板" : "修改按钮模板"}</h3>
                <p className="panel-copy">
                  {selectedTemplate ? `正在编辑：${selectedTemplate.name}` : "上传图片后会自动把纯白背景转为透明。"}
                </p>
              </div>
              <button type="button" className="secondary" onClick={() => setEditorMode(null)}>
                关闭
              </button>
            </div>

            <div className="button-template-editor-layout">
              <section className="button-template-editor-form">
                <label className="button-design-field">
                  <span>模板 ID</span>
                  <input
                    value={draft.id}
                    disabled={editorMode === "update"}
                    onChange={(event) => setDraft((current) => ({ ...current, id: event.target.value }))}
                  />
                </label>
                <label className="button-design-field">
                  <span>模板名称</span>
                  <input
                    value={draft.name}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label className="button-design-field">
                  <span>模板分类</span>
                  <select
                    value={draft.category}
                    onChange={(event) =>
                      setDraft((current) => ({
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
                      setDraft((current) => ({
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
                    onChange={(event) => void handleImageUpload(event.target.files?.[0])}
                  />
                  <strong>上传模板图片</strong>
                  <span>建议使用白底或透明背景按钮图。</span>
                </label>
                <label className="button-template-paste-field">
                  <span>粘贴图片</span>
                  <textarea
                    value={pastedImageValue}
                    placeholder="在这里 Ctrl+V 粘贴图片，或粘贴 data:image/... 文本"
                    onPaste={(event) => void handlePasteImage(event)}
                    onChange={(event) => setPastedImageValue(event.target.value)}
                  />
                </label>
                <button type="button" className="secondary" onClick={() => void handleLoadPastedImage()}>
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
                    <img
                      src={draft.sourceDataUrl}
                      alt={draft.name}
                    />
                    {isNineSliceMode ? (
                      <div
                        className="button-template-nine-slice"
                        style={getVisibleBoundsStyle()}
                        aria-hidden="true"
                        onPointerMove={handleSlicePointerMove}
                        onPointerUp={handleSlicePointerEnd}
                        onPointerCancel={handleSlicePointerEnd}
                      >
                        <button
                          type="button"
                          className="button-template-slice-line horizontal top"
                          style={{ top: `${getHorizontalSlicePercent("top")}%` }}
                          onPointerDown={handleSlicePointerDown("top")}
                        />
                        <button
                          type="button"
                          className="button-template-slice-line horizontal bottom"
                          style={{ top: `${getHorizontalSlicePercent("bottom")}%` }}
                          onPointerDown={handleSlicePointerDown("bottom")}
                        />
                        <button
                          type="button"
                          className="button-template-slice-line vertical left"
                          style={{ left: `${getVerticalSlicePercent("left")}%` }}
                          onPointerDown={handleSlicePointerDown("left")}
                        />
                        <button
                          type="button"
                          className="button-template-slice-line vertical right"
                          style={{ left: `${getVerticalSlicePercent("right")}%` }}
                          onPointerDown={handleSlicePointerDown("right")}
                        />
                      </div>
                    ) : (
                      <div className="button-template-visible-bounds" style={getVisibleBoundsStyle()} aria-hidden="true" />
                    )}
                  </div>
                </div>
                <p className="meta">
                  {isNineSliceMode ? "外框由图案可见边界自动识别；拖动内部四条线调整九宫格切片。" : "外框由图案可见边界自动识别；不可压缩模板会按该图案比例使用。"}
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
              <button type="button" className="secondary" onClick={() => setEditorMode(null)}>
                取消
              </button>
              <button type="button" onClick={() => void handleSave()} disabled={saving}>
                {saving ? "保存中..." : "保存模板"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
        </>
      )}
    </section>
  );
};
