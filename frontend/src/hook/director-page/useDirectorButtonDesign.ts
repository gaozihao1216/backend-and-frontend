import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { listButtonTemplates } from "../../system/api/exports/index.js";
import type { UiButtonTemplate } from "../../objects/api/api-contracts.js";
import { getPageConfig, savePageConfig } from "../../lib/ui-customization.js";
import type { ButtonImageDesign, ImagePolygonPoint } from "../../objects/ui-customization/ui-customization-objects.js";
import {
  clampImageFrame,
  createScanAreaFromPoints,
  findButton,
  generateRowBoundaryPolygon,
  getButtonParentAspectRatio,
  getImageAspectRatio,
  getRenderedButtonAspectRatio,
  renderPolygonImage,
} from "../../lib/director-page/button-design-helpers.js";
import type {
  ButtonDesignType,
  ButtonTemplateChoice,
  FrameCorner,
  PreviewFrameDragState,
  ScanAreaDrawState,
} from "../../objects/director-page/button-design-types.js";
import {
  buttonDesignPreviewHeightPx,
  defaultAutoScanStep,
  defaultImageFrame,
  defaultRenderWhiteTolerance,
  defaultScanArea,
  defaultStaticButtonBackgroundColor,
  defaultStaticButtonTextColor,
  defaultTextScalePercent,
  defaultWhiteTolerance,
} from "../../objects/director-page/button-design-types.js";

export const useDirectorButtonDesign = (
  userId: string,
  pageId: string | null,
  componentId: string | null,
) => {
  const [pageConfig, setPageConfig] = useState(() => pageId ? getPageConfig(pageId) : null);
  const selectedButton = useMemo(() => findButton(pageConfig, componentId), [componentId, pageConfig]);
  const [buttonTemplates, setButtonTemplates] = useState<UiButtonTemplate[]>([]);
  const [designType, setDesignType] = useState<ButtonDesignType>(() =>
    selectedButton?.imageDesign?.outputDataUrl ? "image" : "text",
  );
  const [draftLabel, setDraftLabel] = useState(() => selectedButton?.label ?? "");
  const [draftBackgroundColor, setDraftBackgroundColor] = useState(
    () => selectedButton?.style?.backgroundColor ?? defaultStaticButtonBackgroundColor,
  );
  const [draftTextColor, setDraftTextColor] = useState(
    () => selectedButton?.style?.textColor ?? defaultStaticButtonTextColor,
  );
  const [draftTextScalePercent, setDraftTextScalePercent] = useState(
    () => selectedButton?.style?.textScalePercent ?? defaultTextScalePercent,
  );
  const [templateChoice, setTemplateChoice] = useState<ButtonTemplateChoice>(
    () => selectedButton?.baseDesign?.templateId ?? "custom",
  );
  const [buttonAspectRatio, setButtonAspectRatio] = useState(
    () => getRenderedButtonAspectRatio(pageConfig, selectedButton),
  );
  const [imageSourceDataUrl, setImageSourceDataUrl] = useState(() => selectedButton?.imageDesign?.sourceDataUrl ?? "");
  const [imageSourceName, setImageSourceName] = useState(() => selectedButton?.imageDesign?.sourceName ?? "");
  const [pastedImageValue, setPastedImageValue] = useState("");
  const [polygonPoints, setPolygonPoints] = useState<ImagePolygonPoint[]>(
    () => selectedButton?.imageDesign?.polygonPoints ?? [],
  );
  const [scanArea, setScanArea] = useState(() => selectedButton?.imageDesign?.scanArea ?? defaultScanArea);
  const [imageFrame, setImageFrame] = useState(() => selectedButton?.imageDesign?.imageFrame ?? defaultImageFrame);
  const [outputDataUrl, setOutputDataUrl] = useState(() => selectedButton?.imageDesign?.outputDataUrl ?? "");
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const [scanAreaDrawState, setScanAreaDrawState] = useState<ScanAreaDrawState | null>(null);
  const [previewFrameDragState, setPreviewFrameDragState] = useState<PreviewFrameDragState | null>(null);
  const [skipNextStageClick, setSkipNextStageClick] = useState(false);
  const [feedback, setFeedback] = useState("");

  const hasBaseTemplate = templateChoice !== "custom";
  const selectedTemplate = hasBaseTemplate
    ? buttonTemplates.find((template) => template.id === templateChoice) ?? null
    : null;
  const selectedBaseDesign = selectedTemplate
    ? {
        templateId: selectedTemplate.id,
        sourceDataUrl: selectedTemplate.sourceDataUrl,
        scalingMode: selectedTemplate.scalingMode,
        slice: selectedTemplate.slice,
      }
    : hasBaseTemplate && selectedButton?.baseDesign?.templateId === templateChoice
      ? selectedButton.baseDesign
      : null;
  const isFixedAspectTemplate = selectedBaseDesign?.scalingMode === "fixedAspect";

  useEffect(() => {
    let cancelled = false;

    listButtonTemplates(userId)
      .then((templates) => {
        if (!cancelled) {
          setButtonTemplates(templates);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFeedback(error instanceof Error ? error.message : "按钮模板加载失败。");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedBaseDesign || selectedBaseDesign.scalingMode !== "fixedAspect") {
      return;
    }

    getImageAspectRatio(selectedBaseDesign.sourceDataUrl)
      .then((aspectRatio) => {
        if (!cancelled) {
          setButtonAspectRatio(Math.min(8, Math.max(0.2, aspectRatio)));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setButtonAspectRatio(1);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBaseDesign?.sourceDataUrl, selectedBaseDesign?.scalingMode]);

  useEffect(() => {
    let cancelled = false;

    if (!imageSourceDataUrl || polygonPoints.length < 3) {
      setOutputDataUrl("");
      return;
    }

    renderPolygonImage(imageSourceDataUrl, polygonPoints, defaultRenderWhiteTolerance, scanArea)
      .then((nextOutputDataUrl) => {
        if (!cancelled) {
          setOutputDataUrl(nextOutputDataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOutputDataUrl("");
          setFeedback("图案预览生成失败，请重新选择图片或区域。");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [imageSourceDataUrl, polygonPoints, scanArea]);

  const clearFeedback = () => setFeedback("");

  const loadImageSource = (sourceDataUrl: string, sourceName: string) => {
    setImageSourceDataUrl(sourceDataUrl);
    setImageSourceName(sourceName);
    setPolygonPoints([]);
    setOutputDataUrl("");
    setScanArea(defaultScanArea);
    setImageFrame(defaultImageFrame);
    setPastedImageValue(sourceDataUrl.startsWith("data:image/") ? sourceDataUrl : "");
    setFeedback("");
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const nextSourceDataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!nextSourceDataUrl) {
        setFeedback("图片读取失败，请重新选择。");
        return;
      }

      loadImageSource(nextSourceDataUrl, file.name);
    });
    reader.readAsDataURL(file);
  };

  const handleTemplateChoiceChange = (choice: ButtonTemplateChoice) => {
    setTemplateChoice(choice);
    setFeedback("");

    if (choice === "custom") {
      return;
    }

    const template = buttonTemplates.find((candidate) => candidate.id === choice);
    if (!template) {
      setFeedback("未找到所选按钮模板。");
      return;
    }

    if (template.scalingMode === "fixedAspect") {
      void getImageAspectRatio(template.sourceDataUrl)
        .then((aspectRatio) => {
          setButtonAspectRatio(Math.min(8, Math.max(0.2, aspectRatio)));
        })
        .catch(() => {
          setButtonAspectRatio(1);
        });
    }
  };

  const handlePasteImage = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItem = [...event.clipboardData.items].find((item) => item.type.startsWith("image/"));
    const imageFile = imageItem?.getAsFile();
    if (!imageFile) {
      return;
    }

    event.preventDefault();
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const nextSourceDataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!nextSourceDataUrl) {
        setFeedback("剪贴板图片读取失败，请重新粘贴。");
        return;
      }

      loadImageSource(nextSourceDataUrl, "剪贴板图片");
    });
    reader.readAsDataURL(imageFile);
  };

  const handleLoadPastedImage = () => {
    const value = pastedImageValue.trim();
    if (!value.startsWith("data:image/")) {
      setFeedback("当前先支持 data:image/... 格式，或直接 Ctrl+V 粘贴图片。");
      return;
    }

    loadImageSource(value, "粘贴图片");
  };

  const handleImageStageClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (skipNextStageClick) {
      setSkipNextStageClick(false);
      return;
    }
    if (!imageSourceDataUrl || scanAreaDrawState) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setPolygonPoints((current) => [
      ...current,
      {
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
      },
    ]);
    setFeedback("");
  };

  const getPolygonPointFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const handlePolygonPointPointerDown = (pointIndex: number) => (event: PointerEvent<SVGCircleElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDraggingPointIndex(pointIndex);
    event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
  };

  const handlePolygonPointMove = (event: PointerEvent<SVGSVGElement>) => {
    if (draggingPointIndex === null) {
      return;
    }

    const nextPoint = getPolygonPointFromPointer(event);
    setPolygonPoints((current) =>
      current.map((point, index) => index === draggingPointIndex ? nextPoint : point),
    );
    setFeedback("");
  };

  const handlePolygonPointDragEnd = (event: PointerEvent<SVGSVGElement>) => {
    setDraggingPointIndex(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleAutoTrace = () => {
    if (!imageSourceDataUrl) {
      setFeedback("请先上传或粘贴图片。");
      return;
    }

    generateRowBoundaryPolygon(imageSourceDataUrl, defaultWhiteTolerance, defaultAutoScanStep, scanArea)
      .then((nextPolygonPoints) => {
        if (nextPolygonPoints.length < 3) {
          setFeedback("没有识别到可截取的非白色图案，请调大白底容差或更换图片。");
          return;
        }

        setPolygonPoints(nextPolygonPoints);
        setFeedback(`已自动生成 ${nextPolygonPoints.length} 个边界点。`);
      })
      .catch(() => setFeedback("自动打点失败，请重新选择图片。"));
  };

  const getStagePointFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const handleScanAreaDrawStart = (event: PointerEvent<HTMLButtonElement>) => {
    if (!imageSourceDataUrl) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest(".button-design-polygon-layer")) {
      return;
    }

    event.preventDefault();
    const startPoint = getStagePointFromPointer(event);
    setScanAreaDrawState({ startPoint });
    setScanArea({
      x: startPoint.x,
      y: startPoint.y,
      width: 1,
      height: 1,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
    setFeedback("");
  };

  const handleScanAreaDrawMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!scanAreaDrawState) {
      return;
    }

    setScanArea(createScanAreaFromPoints(scanAreaDrawState.startPoint, getStagePointFromPointer(event)));
  };

  const handleScanAreaDrawEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (scanAreaDrawState) {
      setScanArea(createScanAreaFromPoints(scanAreaDrawState.startPoint, getStagePointFromPointer(event)));
      setSkipNextStageClick(true);
    }
    setScanAreaDrawState(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePreviewFramePointerDown =
    (target: PreviewFrameDragState["target"], corner: FrameCorner) =>
    (event: PointerEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (target === "button" && isFixedAspectTemplate) {
        setFeedback("采用不可压缩模板后，按钮宽高比例由模板锁定。");
        return;
      }
      const previewButton = event.currentTarget.closest<HTMLButtonElement>(".button-design-live-preview");
      if (!previewButton) {
        return;
      }

      setPreviewFrameDragState(
        target === "button"
          ? {
              target,
              corner,
              startX: event.clientX,
              startY: event.clientY,
              startAspectRatio: buttonAspectRatio,
            }
          : {
              target,
              corner,
              startX: event.clientX,
              startY: event.clientY,
              startFrame: imageFrame,
            },
      );
      previewButton.setPointerCapture(event.pointerId);
      setFeedback("");
    };

  const handlePreviewFramePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!previewFrameDragState) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const deltaXPercent = ((event.clientX - previewFrameDragState.startX) / rect.width) * 100;
    const deltaYPercent = ((event.clientY - previewFrameDragState.startY) / rect.height) * 100;

    if (previewFrameDragState.target === "button") {
      const cornerSign =
        previewFrameDragState.corner === "top-left" || previewFrameDragState.corner === "bottom-left" ? -1 : 1;
      const nextRatio =
        previewFrameDragState.startAspectRatio
        + (cornerSign * (event.clientX - previewFrameDragState.startX)) / buttonDesignPreviewHeightPx;
      setButtonAspectRatio(Math.min(8, Math.max(0.2, nextRatio)));
      return;
    }

    const start = previewFrameDragState.startFrame;
    const isLeft = previewFrameDragState.corner === "top-left" || previewFrameDragState.corner === "bottom-left";
    const isTop = previewFrameDragState.corner === "top-left" || previewFrameDragState.corner === "top-right";
    setImageFrame(clampImageFrame({
      x: isLeft ? start.x + deltaXPercent : start.x,
      y: isTop ? start.y + deltaYPercent : start.y,
      width: isLeft ? start.width - deltaXPercent : start.width + deltaXPercent,
      height: isTop ? start.height - deltaYPercent : start.height + deltaYPercent,
    }));
  };

  const handlePreviewFramePointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    setPreviewFrameDragState(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const undoPolygonPoint = () => {
    setPolygonPoints((current) => current.slice(0, -1));
    setFeedback("");
  };

  const resetPolygon = () => {
    setPolygonPoints([]);
    setOutputDataUrl("");
    setFeedback("");
  };

  const handleSave = () => {
    if (!pageConfig || !selectedButton) {
      return;
    }

    const normalizedLabel = draftLabel.trim();
    if (designType === "text" && !normalizedLabel) {
      setFeedback("文本按钮内容不能为空。");
      return;
    }
    if (designType === "image" && (!imageSourceDataUrl || polygonPoints.length < 3 || !outputDataUrl)) {
      setFeedback("请先上传图片，并用至少 3 个点圈出图案。");
      return;
    }

    const nextBaseDesign = selectedBaseDesign ?? undefined;
    const nextImageDesign: ButtonImageDesign | undefined =
      designType === "image"
        ? {
            sourceDataUrl: imageSourceDataUrl,
            ...(imageSourceName ? { sourceName: imageSourceName } : {}),
            scanArea,
            imageFrame,
            polygonPoints,
            whiteTolerance: defaultWhiteTolerance,
            renderWhiteTolerance: defaultRenderWhiteTolerance,
            outputDataUrl,
          }
        : undefined;
    const parentAspectRatio = getButtonParentAspectRatio(pageConfig, selectedButton);
    const positionAspectRatio = parentAspectRatio > 0 ? buttonAspectRatio / parentAspectRatio : buttonAspectRatio;

    const nextPageConfig = {
      ...pageConfig,
      components: pageConfig.components.map((component) =>
        component.id === selectedButton.id && component.type === "button"
          ? {
              ...component,
              label: designType === "text" ? normalizedLabel : component.label,
              baseDesign: nextBaseDesign,
              imageDesign: nextImageDesign,
              position: designType === "image" || isFixedAspectTemplate
                ? {
                    ...component.position,
                    width: component.position.height * positionAspectRatio,
                  }
                : component.position,
              style: {
                ...component.style,
                backgroundColor: draftBackgroundColor,
                textColor: draftTextColor,
                fontSize: undefined,
                textScalePercent: draftTextScalePercent,
                lockAspectRatio: isFixedAspectTemplate || (designType === "image" && !selectedBaseDesign)
                  ? positionAspectRatio
                  : undefined,
              },
            }
          : component,
      ),
    };

    const savedConfig = savePageConfig(nextPageConfig);
    setPageConfig(savedConfig);
    setDraftLabel(findButton(savedConfig, selectedButton.id)?.label ?? normalizedLabel);
    setFeedback("按钮美化已保存。");
  };

  return {
    pageId,
    pageConfig,
    selectedButton,
    buttonTemplates,
    designType,
    setDesignType,
    draftLabel,
    setDraftLabel,
    draftBackgroundColor,
    setDraftBackgroundColor,
    draftTextColor,
    setDraftTextColor,
    draftTextScalePercent,
    setDraftTextScalePercent,
    templateChoice,
    selectedBaseDesign,
    isFixedAspectTemplate,
    buttonAspectRatio,
    imageSourceDataUrl,
    imageSourceName,
    pastedImageValue,
    setPastedImageValue,
    polygonPoints,
    scanArea,
    imageFrame,
    outputDataUrl,
    feedback,
    clearFeedback,
    handleImageSelect,
    handleTemplateChoiceChange,
    handlePasteImage,
    handleLoadPastedImage,
    handleImageStageClick,
    handlePolygonPointPointerDown,
    handlePolygonPointMove,
    handlePolygonPointDragEnd,
    handleAutoTrace,
    handleScanAreaDrawStart,
    handleScanAreaDrawMove,
    handleScanAreaDrawEnd,
    handlePreviewFramePointerDown,
    handlePreviewFramePointerMove,
    handlePreviewFramePointerEnd,
    undoPolygonPoint,
    resetPolygon,
    handleSave,
  };
};

export type ButtonDesignViewModel = ReturnType<typeof useDirectorButtonDesign>;
