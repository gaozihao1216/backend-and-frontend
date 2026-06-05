import { useEffect, useMemo, useState } from "react";
import {
  createButtonTemplate,
  deleteButtonTemplate,
  listButtonTemplates,
  updateButtonTemplate,
} from "../api/index.js";
import type { UiButtonTemplate } from "../api/api-contracts.js";

type DirectorButtonTemplatesPageProps = {
  userId: string;
  onBack: () => void;
};

type EditorMode = "create" | "update";

type TemplateDraft = {
  id: string;
  name: string;
  sourceDataUrl: string;
  slice: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
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

const createDefaultDraft = (): TemplateDraft => ({
  id: `button-template-${Date.now()}`,
  name: "新按钮模板",
  sourceDataUrl: defaultTemplateDataUrl,
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
  slice: { ...template.slice },
});

const createTemplateFromDraft = (draft: TemplateDraft): UiButtonTemplate => ({
  id: draft.id.trim(),
  name: draft.name.trim(),
  sourceDataUrl: draft.sourceDataUrl,
  slice: {
    top: Number.isFinite(draft.slice.top) ? draft.slice.top : 0,
    right: Number.isFinite(draft.slice.right) ? draft.slice.right : 0,
    bottom: Number.isFinite(draft.slice.bottom) ? draft.slice.bottom : 0,
    left: Number.isFinite(draft.slice.left) ? draft.slice.left : 0,
  },
});

const processTemplateImage = async (dataUrl: string): Promise<string> => {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return dataUrl;
  }

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index] ?? 0;
    const green = pixels[index + 1] ?? 0;
    const blue = pixels[index + 2] ?? 0;
    if (red >= 248 && green >= 248 && blue >= 248) {
      pixels[index + 3] = 0;
    }
  }
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("图片读取失败。"));
      }
    };
    reader.onerror = () => reject(new Error("图片读取失败。"));
    reader.readAsDataURL(file);
  });

export const DirectorButtonTemplatesPage = ({ userId, onBack }: DirectorButtonTemplatesPageProps) => {
  const [templates, setTemplates] = useState<UiButtonTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [draft, setDraft] = useState<TemplateDraft>(() => createDefaultDraft());
  const [saving, setSaving] = useState(false);

  const selectedTemplate = useMemo(
    () => editorMode === "update" ? templates.find((template) => template.id === draft.id) ?? null : null,
    [draft.id, editorMode, templates],
  );

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

  const openCreateEditor = () => {
    setDraft(createDefaultDraft());
    setEditorMode("create");
    setMessage("");
    setError("");
  };

  const openUpdateEditor = (template: UiButtonTemplate) => {
    setDraft(createDraftFromTemplate(template));
    setEditorMode("update");
    setMessage("");
    setError("");
  };

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      const rawDataUrl = await readFileAsDataUrl(file);
      const processedDataUrl = await processTemplateImage(rawDataUrl);
      setDraft((current) => ({
        ...current,
        sourceDataUrl: processedDataUrl,
      }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "图片处理失败。");
    }
  };

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
          <h2>按钮模板</h2>
          <p className="panel-copy">管理可复用的按钮图像模板，模板用于按钮渲染后会锁定按钮宽高比例。</p>
        </div>
        <div className="director-ui-header-actions">
          <button type="button" className="secondary" onClick={onBack}>
            返回 UI 美化配置
          </button>
          <button type="button" onClick={openCreateEditor}>
            新增模板
          </button>
        </div>
      </div>

      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      {loading ? (
        <p className="meta">正在读取按钮模板...</p>
      ) : templates.length > 0 ? (
        <div className="button-template-grid">
          {templates.map((template) => (
            <article key={template.id} className="button-template-card">
              <div className="button-template-preview">
                <img src={template.sourceDataUrl} alt={template.name} />
              </div>
              <div className="button-template-card-body">
                <div>
                  <strong>{template.name}</strong>
                  <p className="meta">{template.id}</p>
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
                <label className="button-design-file-drop">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => void handleImageUpload(event.target.files?.[0])}
                  />
                  <strong>上传模板图片</strong>
                  <span>建议使用白底或透明背景按钮图。</span>
                </label>
                <div className="button-template-slice-grid">
                  {(["top", "right", "bottom", "left"] as const).map((key) => (
                    <label key={key} className="button-design-field">
                      <span>{key}</span>
                      <input
                        type="number"
                        min={0}
                        value={draft.slice[key]}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            slice: {
                              ...current.slice,
                              [key]: Number(event.target.value),
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className="button-template-editor-preview">
                <h4>模板预览</h4>
                <div className="button-template-large-preview">
                  <img src={draft.sourceDataUrl} alt={draft.name} />
                </div>
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
    </section>
  );
};
