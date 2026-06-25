import { useCallback, useEffect, useMemo, useState, type ClipboardEvent, type PointerEvent } from "react";
import {
  createButtonTemplate,
  deleteButtonTemplate,
  listButtonTemplates,
  updateButtonTemplate,
} from "../../system/api/exports/index.js";
import type { UiButtonTemplate } from "../../objects/api/api-contracts.js";
import { processTemplateImage, readFileAsDataUrl } from "../../lib/template-image-utils.js";
import {
  createDefaultDraft,
  createDraftFromTemplate,
  createTemplateFromDraft,
  detectVisibleImageBounds,
  getHorizontalSlicePercent,
  getVerticalSlicePercent,
  getVisibleBoundsStyle,
} from "../../lib/director-page/button-template-draft.js";
import {
  normalizeButtonTemplateCategory,
  type ButtonTemplateCategory,
} from "../../objects/ui/category/template-category.js";
import type {
  EditorMode,
  ImageBounds,
  ImageSize,
  SliceKey,
  TemplateDraft,
  TemplateTab,
} from "../../objects/director-page/button-template-types.js";

export const useDirectorButtonTemplates = (userId: string) => {
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

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTemplates(await listButtonTemplates(userId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "按钮模板加载失败。");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

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
  }, [draft.sourceDataUrl, previewImageSize.width, previewImageSize.height]);

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

  const closeEditor = () => {
    setEditorMode(null);
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

  const switchTab = (tab: TemplateTab) => {
    setActiveTab(tab);
    setMessage("");
    setError("");
  };

  const visibleBoundsStyle = getVisibleBoundsStyle(previewImageBounds, previewImageSize);

  return {
    activeTab,
    switchTab,
    filteredTemplates,
    loading,
    message,
    error,
    editorMode,
    draft,
    setDraft,
    pastedImageValue,
    setPastedImageValue,
    previewImageSize,
    previewImageBounds,
    isNineSliceMode,
    saving,
    categoryFilter,
    setCategoryFilter,
    selectedTemplate,
    openCreateEditor,
    openUpdateEditor,
    closeEditor,
    handleImageUpload,
    handlePasteImage,
    handleLoadPastedImage,
    handleSlicePointerDown,
    handleSlicePointerMove,
    handleSlicePointerEnd,
    handleSave,
    handleDelete,
    getVerticalSlicePercent: (key: "left" | "right") => getVerticalSlicePercent(key, draft, previewImageBounds),
    getHorizontalSlicePercent: (key: "top" | "bottom") => getHorizontalSlicePercent(key, draft, previewImageBounds),
    visibleBoundsStyle,
  };
};
