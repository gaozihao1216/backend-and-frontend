import { useCallback, useEffect, useMemo, useState, type ClipboardEvent } from "react";
import {
  createStretchVisualTemplate,
} from "../../../../api/ui/stretchtemplates/CreateStretchVisualTemplateApi.js";
import { deleteStretchVisualTemplate } from "../../../../api/ui/stretchtemplates/DeleteStretchVisualTemplateApi.js";
import { listStretchVisualTemplates } from "../../../../api/ui/stretchtemplates/ListStretchVisualTemplatesApi.js";
import { updateStretchVisualTemplate } from "../../../../api/ui/stretchtemplates/UpdateStretchVisualTemplateApi.js";
import { processTemplateImage, readFileAsDataUrl } from "../../../shared/function/ui-design/template-image-utils.js";
import {
  StretchVisualTemplateSchema,
  getDefaultStretchVisualTemplateCategory,
  type StretchVisualTemplate,
  type StretchVisualTemplateKind,
} from "../../../../objects/ui/stretch_template/stretch-visual-template.js";
import {
  getPanelTemplateCategoryLabel,
  getPatternTemplateCategoryLabel,
  normalizePanelTemplateCategory,
  normalizePatternTemplateCategory,
  PANEL_TEMPLATE_CATEGORIES,
  PATTERN_TEMPLATE_CATEGORIES,
  type PanelTemplateCategory,
  type PatternTemplateCategory,
} from "../../../../objects/ui/category/template-category.js";
import { TemplateCategoryFilter } from "../../shared/TemplateCategoryFilter.js";

type SimpleStretchTemplateSectionProps = {
  userId: string;
  kind: StretchVisualTemplateKind;
  title: string;
  description: string;
  idPrefix: string;
  defaultName: string;
  defaultDataUrl: string;
};

type EditorMode = "create" | "update";

type TemplateDraft = {
  id: string;
  name: string;
  sourceDataUrl: string;
  category: PanelTemplateCategory | PatternTemplateCategory;
};

const LEGACY_STORAGE_KEY = "ugc-level-platform.stretch-visual-templates.v1";

const createDefaultDraft = (
  idPrefix: string,
  defaultName: string,
  defaultDataUrl: string,
  kind: StretchVisualTemplateKind,
): TemplateDraft => ({
  id: `${idPrefix}-${Date.now()}`,
  name: defaultName,
  sourceDataUrl: defaultDataUrl,
  category: getDefaultStretchVisualTemplateCategory(kind),
});

const createDraftFromTemplate = (template: StretchVisualTemplate): TemplateDraft => ({
  id: template.id,
  name: template.name,
  sourceDataUrl: template.sourceDataUrl,
  category: template.kind === "panel"
    ? normalizePanelTemplateCategory(template.category)
    : normalizePatternTemplateCategory(template.category),
});

const createTemplateFromDraft = (kind: StretchVisualTemplateKind, draft: TemplateDraft): StretchVisualTemplate => ({
  id: draft.id.trim(),
  name: draft.name.trim(),
  sourceDataUrl: draft.sourceDataUrl,
  kind,
  category: draft.category,
});

const readLegacyTemplates = (kind: StretchVisualTemplateKind): StretchVisualTemplate[] => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const legacyRows = Array.isArray(parsed) ? parsed : [];
    return StretchVisualTemplateSchema.array()
      .parse(
        legacyRows.map((entry) => {
          const template = entry as StretchVisualTemplate;
          return {
            ...template,
            category: template.category ?? getDefaultStretchVisualTemplateCategory(template.kind),
          };
        }),
      )
      .filter((template) => template.kind === kind);
  } catch {
    return [];
  }
};

const removeLegacyTemplates = (kind: StretchVisualTemplateKind) => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }

  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const remaining = StretchVisualTemplateSchema.array()
      .parse(JSON.parse(raw) as unknown)
      .filter((template) => template.kind !== kind);
    if (remaining.length === 0) {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } else {
      window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(remaining));
    }
  } catch {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
};

export const SimpleStretchTemplateSection = ({
  userId,
  kind,
  title,
  description,
  idPrefix,
  defaultName,
  defaultDataUrl,
}: SimpleStretchTemplateSectionProps) => {
  const [templates, setTemplates] = useState<StretchVisualTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [draft, setDraft] = useState<TemplateDraft>(() => createDefaultDraft(idPrefix, defaultName, defaultDataUrl, kind));
  const [pastedImageValue, setPastedImageValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<PanelTemplateCategory | PatternTemplateCategory | "all">("all");

  const categoryOptions = kind === "panel" ? PANEL_TEMPLATE_CATEGORIES : PATTERN_TEMPLATE_CATEGORIES;
  const filteredTemplates = useMemo(
    () => categoryFilter === "all"
      ? templates
      : templates.filter((template) => template.category === categoryFilter),
    [categoryFilter, templates],
  );
  const getCategoryLabel = (category: string) =>
    kind === "panel" ? getPanelTemplateCategoryLabel(normalizePanelTemplateCategory(category)) : getPatternTemplateCategoryLabel(normalizePatternTemplateCategory(category));

  const migrateLegacyTemplates = useCallback(async () => {
    const legacyTemplates = readLegacyTemplates(kind);
    if (legacyTemplates.length === 0) {
      return false;
    }

    for (const template of legacyTemplates) {
      try {
        await createStretchVisualTemplate(userId, template);
      } catch {
        // Ignore duplicates or invalid legacy rows during one-time migration.
      }
    }

    removeLegacyTemplates(kind);
    return true;
  }, [kind, userId]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let nextTemplates = await listStretchVisualTemplates(userId, kind);
      if (nextTemplates.length === 0) {
        const migrated = await migrateLegacyTemplates();
        if (migrated) {
          nextTemplates = await listStretchVisualTemplates(userId, kind);
          if (nextTemplates.length > 0) {
            setMessage(`已将本地${title}迁移到后端。`);
          }
        }
      }
      setTemplates(nextTemplates);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : `${title}加载失败。`);
    } finally {
      setLoading(false);
    }
  }, [kind, migrateLegacyTemplates, title, userId]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const openCreateEditor = () => {
    setDraft(createDefaultDraft(idPrefix, defaultName, defaultDataUrl, kind));
    setPastedImageValue("");
    setEditorMode("create");
    setMessage("");
    setError("");
  };

  const openUpdateEditor = (template: StretchVisualTemplate) => {
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

  const handleSave = async () => {
    if (!editorMode) {
      return;
    }

    const template = createTemplateFromDraft(kind, draft);
    if (!template.id || !template.name || !template.sourceDataUrl) {
      setError("模板 ID、名称和图片不能为空。");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const savedTemplate = editorMode === "create"
        ? await createStretchVisualTemplate(userId, template)
        : await updateStretchVisualTemplate(userId, template.id, template);
      setTemplates((current) => {
        const exists = current.some((item) => item.id === savedTemplate.id);
        return exists
          ? current.map((item) => item.id === savedTemplate.id ? savedTemplate : item)
          : [...current, savedTemplate].sort((left, right) => left.id.localeCompare(right.id));
      });
      setEditorMode(null);
      setMessage(editorMode === "create" ? `${title}已新增。` : `${title}已更新。`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : `${title}保存失败。`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: StretchVisualTemplate) => {
    const confirmed = window.confirm(`确认删除${title}“${template.name}”？`);
    if (!confirmed) {
      return;
    }

    setError("");
    try {
      await deleteStretchVisualTemplate(userId, kind, template.id);
      setTemplates((current) => current.filter((item) => item.id !== template.id));
      setMessage(`${title}已删除。`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : `${title}删除失败。`);
    }
  };

  return (
    <div className="director-template-section">
      <div className="director-template-section-header">
        <div>
          <h3>{title}</h3>
          <p className="panel-copy">{description}</p>
        </div>
        <button type="button" onClick={openCreateEditor}>
          新增{title}
        </button>
      </div>

      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      <TemplateCategoryFilter
        categories={categoryOptions}
        activeCategory={categoryFilter}
        onChange={setCategoryFilter}
      />

      {loading ? (
        <p className="meta">正在读取{title}...</p>
      ) : filteredTemplates.length > 0 ? (
        <div className="button-template-grid">
          {filteredTemplates.map((template) => (
            <article key={template.id} className="button-template-card">
              <div className="button-template-preview stretch-template-preview">
                <img src={template.sourceDataUrl} alt={template.name} className="stretch-template-image" />
              </div>
              <div className="button-template-card-body">
                <div>
                  <strong>{template.name}</strong>
                  <p className="meta">{template.id}</p>
                  <p className="template-category-badge">{getCategoryLabel(template.category)}</p>
                  <p className="meta">可压缩 · 整体拉伸</p>
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
          <p>暂无{title}。</p>
          <button type="button" onClick={openCreateEditor}>
            新增第一个{title}
          </button>
        </section>
      )}

      {editorMode ? (
        <div className="button-template-modal" role="dialog" aria-modal="true">
          <section className="button-template-editor">
            <div className="mini-card-header">
              <div>
                <h3>{editorMode === "create" ? `新增${title}` : `修改${title}`}</h3>
                <p className="panel-copy">上传图片后会自动把纯白背景转为透明；模板统一采用整体拉伸缩放，并保存到后端数据库。</p>
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
                        category: event.target.value as TemplateDraft["category"],
                      }))
                    }
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="meta">缩放方式固定为可压缩（整体拉伸），无需设置九宫格分割线。</p>
                <label className="button-design-file-drop">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => void handleImageUpload(event.target.files?.[0])}
                  />
                  <strong>上传模板图片</strong>
                  <span>建议使用白底或透明背景素材。</span>
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
              </section>

              <section className="button-template-editor-preview">
                <h4>模板预览</h4>
                <div className="button-template-large-preview">
                  <div className="button-template-stretch-frame">
                    <img src={draft.sourceDataUrl} alt={draft.name} className="stretch-template-image" />
                  </div>
                </div>
                <p className="meta">整体拉伸：宽高变化时整张图一起缩放，不做九宫格切片。</p>
                <div className="button-template-preview-row">
                  <button type="button" className="button-template-sample stretch-template-sample">
                    <img src={draft.sourceDataUrl} alt="" className="stretch-template-image" />
                    <span>标准尺寸</span>
                  </button>
                  <button type="button" className="button-template-sample wide stretch-template-sample">
                    <img src={draft.sourceDataUrl} alt="" className="stretch-template-image" />
                    <span>宽尺寸拉伸</span>
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
    </div>
  );
};
