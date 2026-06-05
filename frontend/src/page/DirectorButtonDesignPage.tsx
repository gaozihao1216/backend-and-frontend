import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { listButtonTemplates } from "../api/index.js";
import type { UiButtonTemplate } from "../api/api-contracts.js";
import { getPageConfig, savePageConfig } from "../lib/ui-customization.js";
import type {
  ButtonComponent,
  ButtonImageDesign,
  ImageCrop,
  ImagePolygonPoint,
  PageConfig,
} from "../objects/ui-customization/ui-customization-objects.js";
import {
  getButtonImageDesignStyle,
  getButtonTextScaleStyle,
} from "../component/ui-renderer/ui-renderer-utils.js";

type DirectorButtonDesignPageProps = {
  userId: string;
  pageId: string | null;
  componentId: string | null;
  onBack: () => void;
};

type ButtonDesignType = "text" | "image";
type ButtonTemplateChoice = "custom" | string;
type ScanAreaDrawState = {
  startPoint: ImagePolygonPoint;
};
type FrameCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type PreviewFrameDragState =
  | {
      target: "button";
      corner: FrameCorner;
      startX: number;
      startY: number;
      startAspectRatio: number;
    }
  | {
      target: "image";
      corner: FrameCorner;
      startX: number;
      startY: number;
      startFrame: ImageCrop;
    };

const defaultStaticButtonBackgroundColor = "#ffbe5c";
const defaultStaticButtonTextColor = "#fff9ef";
const defaultTextScalePercent = 42;
const defaultWhiteTolerance = 22;
const defaultRenderWhiteTolerance = -1;
const defaultAutoScanStep = 21;
const buttonDesignPreviewHeightPx = 132;
const defaultScanArea: ImageCrop = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};
const defaultImageFrame: ImageCrop = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

const getImageAspectRatio = async (dataUrl: string): Promise<number> => {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  return image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : 1;
};

const findButton = (pageConfig: PageConfig | null, componentId: string | null): ButtonComponent | null => {
  const component = componentId ? pageConfig?.components.find((candidate) => candidate.id === componentId) : null;
  return component?.type === "button" ? component : null;
};

const clampScanArea = (scanArea: ImageCrop): ImageCrop => {
  const width = Math.min(100, Math.max(1, scanArea.width));
  const height = Math.min(100, Math.max(1, scanArea.height));
  return {
    x: Math.min(100 - width, Math.max(0, scanArea.x)),
    y: Math.min(100 - height, Math.max(0, scanArea.y)),
    width,
    height,
  };
};

const getParentPanelId = (pageConfig: PageConfig, componentId: string) =>
  pageConfig.components.find(
    (component) => component.type === "panel" && component.childComponentIds.includes(componentId),
  )?.id ?? null;

const getParentPanelChain = (pageConfig: PageConfig, componentId: string) => {
  const chain = [];
  let currentParentId = getParentPanelId(pageConfig, componentId);

  while (currentParentId) {
    const parent = pageConfig.components.find((component) => component.id === currentParentId);
    if (!parent || parent.type !== "panel") {
      break;
    }

    chain.unshift(parent);
    currentParentId = getParentPanelId(pageConfig, parent.id);
  }

  return chain;
};

const getPositionSizeInParent = (size: { width: number; height: number }, position: ButtonComponent["position"]) => {
  if (position.unit === "px") {
    return {
      width: position.width,
      height: position.height,
    };
  }

  return {
    width: (size.width * position.width) / 100,
    height: (size.height * position.height) / 100,
  };
};

const getButtonParentAspectRatio = (pageConfig: PageConfig | null, button: ButtonComponent | null) => {
  if (!pageConfig || !button) {
    return 1;
  }

  let size = { width: 16, height: 9 };
  getParentPanelChain(pageConfig, button.id).forEach((panel) => {
    size = getPositionSizeInParent(size, panel.position);
    if (panel.contentSize) {
      size = {
        width: (size.width * panel.contentSize.widthPercent) / 100,
        height: (size.height * panel.contentSize.heightPercent) / 100,
      };
    }
  });

  return size.height > 0 ? size.width / size.height : 1;
};

const getRenderedButtonAspectRatio = (
  pageConfig: PageConfig | null,
  button: ButtonComponent | null,
) => {
  if (!button) {
    return 1;
  }

  const positionAspectRatio = button.position.height > 0 ? button.position.width / button.position.height : 1;
  return positionAspectRatio * getButtonParentAspectRatio(pageConfig, button);
};

const loadImage = (sourceDataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("image load failed")));
    image.src = sourceDataUrl;
  });

const renderPolygonImage = async (
  sourceDataUrl: string,
  polygonPoints: ImagePolygonPoint[],
  whiteTolerance: number,
  scanArea: ImageCrop,
) => {
  if (polygonPoints.length < 3) {
    return "";
  }

  const image = await loadImage(sourceDataUrl);
  const sourceX = Math.max(0, Math.floor((scanArea.x / 100) * image.naturalWidth));
  const sourceY = Math.max(0, Math.floor((scanArea.y / 100) * image.naturalHeight));
  const sourceWidth = Math.max(1, Math.ceil((scanArea.width / 100) * image.naturalWidth));
  const sourceHeight = Math.max(1, Math.ceil((scanArea.height / 100) * image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  context.save();
  context.beginPath();
  polygonPoints.forEach((point, index) => {
    const x = ((point.x - scanArea.x) / scanArea.width) * canvas.width;
    const y = ((point.y - scanArea.y) / scanArea.height) * canvas.height;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.closePath();
  context.clip();
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
  context.restore();

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] ?? 0;
    if (alpha === 0) {
      continue;
    }

    const red = data[index] ?? 0;
    const green = data[index + 1] ?? 0;
    const blue = data[index + 2] ?? 0;
    if (red >= 255 - whiteTolerance && green >= 255 - whiteTolerance && blue >= 255 - whiteTolerance) {
      data[index + 3] = 0;
    }
  }
  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
};

const isNonWhitePixel = (
  data: Uint8ClampedArray,
  index: number,
  whiteTolerance: number,
) => {
  const alpha = data[index + 3] ?? 0;
  if (alpha === 0) {
    return false;
  }

  const red = data[index] ?? 0;
  const green = data[index + 1] ?? 0;
  const blue = data[index + 2] ?? 0;
  return !(red >= 255 - whiteTolerance && green >= 255 - whiteTolerance && blue >= 255 - whiteTolerance);
};

const generateRowBoundaryPolygon = async (
  sourceDataUrl: string,
  whiteTolerance: number,
  yStep: number,
  scanArea: ImageCrop,
): Promise<ImagePolygonPoint[]> => {
  const image = await loadImage(sourceDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return [];
  }

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const leftBoundary: ImagePolygonPoint[] = [];
  const rightBoundary: ImagePolygonPoint[] = [];
  const step = Math.max(1, Math.round(yStep));
  const startX = Math.max(0, Math.floor((scanArea.x / 100) * canvas.width));
  const endX = Math.min(canvas.width - 1, Math.ceil(((scanArea.x + scanArea.width) / 100) * canvas.width));
  const startY = Math.max(0, Math.floor((scanArea.y / 100) * canvas.height));
  const endY = Math.min(canvas.height - 1, Math.ceil(((scanArea.y + scanArea.height) / 100) * canvas.height));

  for (let y = startY; y <= endY; y += step) {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;

    for (let x = startX; x <= endX; x += 1) {
      const pixelIndex = (y * canvas.width + x) * 4;
      if (isNonWhitePixel(imageData.data, pixelIndex, whiteTolerance)) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }

    if (Number.isFinite(minX) && Number.isFinite(maxX)) {
      const yPercent = (y / canvas.height) * 100;
      leftBoundary.push({
        x: (minX / canvas.width) * 100,
        y: yPercent,
      });
      rightBoundary.push({
        x: (maxX / canvas.width) * 100,
        y: yPercent,
      });
    }
  }

  return [...leftBoundary, ...rightBoundary.reverse()];
};

export const DirectorButtonDesignPage = ({ userId, pageId, componentId, onBack }: DirectorButtonDesignPageProps) => {
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(() => pageId ? getPageConfig(pageId) : null);
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
  const [templateChoice, setTemplateChoice] = useState<ButtonTemplateChoice>("custom");
  const [buttonAspectRatio, setButtonAspectRatio] = useState(
    () => getRenderedButtonAspectRatio(pageConfig, selectedButton),
  );
  const [imageSourceDataUrl, setImageSourceDataUrl] = useState(() => selectedButton?.imageDesign?.sourceDataUrl ?? "");
  const [imageSourceName, setImageSourceName] = useState(() => selectedButton?.imageDesign?.sourceName ?? "");
  const [pastedImageValue, setPastedImageValue] = useState("");
  const [polygonPoints, setPolygonPoints] = useState<ImagePolygonPoint[]>(
    () => selectedButton?.imageDesign?.polygonPoints ?? [],
  );
  const [scanArea, setScanArea] = useState<ImageCrop>(() =>
    selectedButton?.imageDesign?.scanArea ?? defaultScanArea,
  );
  const [imageFrame, setImageFrame] = useState<ImageCrop>(() =>
    selectedButton?.imageDesign?.imageFrame ?? defaultImageFrame,
  );
  const [outputDataUrl, setOutputDataUrl] = useState(() => selectedButton?.imageDesign?.outputDataUrl ?? "");
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const [scanAreaDrawState, setScanAreaDrawState] = useState<ScanAreaDrawState | null>(null);
  const [previewFrameDragState, setPreviewFrameDragState] = useState<PreviewFrameDragState | null>(null);
  const [skipNextStageClick, setSkipNextStageClick] = useState(false);
  const [feedback, setFeedback] = useState("");
  const isTemplateMode = templateChoice !== "custom";
  const selectedTemplate = isTemplateMode
    ? buttonTemplates.find((template) => template.id === templateChoice) ?? null
    : null;
  const isFixedAspectTemplate = selectedTemplate?.scalingMode === "fixedAspect";

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

    if (isTemplateMode) {
      return;
    }

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
  }, [imageSourceDataUrl, isTemplateMode, polygonPoints, scanArea]);

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

      setImageSourceDataUrl(nextSourceDataUrl);
      setImageSourceName(file.name);
      setPolygonPoints([]);
      setOutputDataUrl("");
      setScanArea(defaultScanArea);
      setImageFrame(defaultImageFrame);
      setTemplateChoice("custom");
      setFeedback("");
    });
    reader.readAsDataURL(file);
  };

  const loadImageSource = (sourceDataUrl: string, sourceName: string) => {
    setImageSourceDataUrl(sourceDataUrl);
    setImageSourceName(sourceName);
    setPolygonPoints([]);
    setOutputDataUrl("");
    setScanArea(defaultScanArea);
    setImageFrame(defaultImageFrame);
    setPastedImageValue(sourceDataUrl.startsWith("data:image/") ? sourceDataUrl : "");
    setTemplateChoice("custom");
    setFeedback("");
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

    setDesignType("image");
    setImageSourceDataUrl(template.sourceDataUrl);
    setImageSourceName(template.name);
    setPolygonPoints([]);
    setOutputDataUrl(template.sourceDataUrl);
    setScanArea(defaultScanArea);
    setImageFrame(defaultImageFrame);
    setPastedImageValue("");
    void getImageAspectRatio(template.sourceDataUrl)
      .then((aspectRatio) => {
        setButtonAspectRatio(Math.min(8, Math.max(0.2, aspectRatio)));
      })
      .catch(() => {
        setButtonAspectRatio(1);
      });
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

  const createScanAreaFromPoints = (startPoint: ImagePolygonPoint, endPoint: ImagePolygonPoint) =>
    clampScanArea({
      x: Math.min(startPoint.x, endPoint.x),
      y: Math.min(startPoint.y, endPoint.y),
      width: Math.abs(endPoint.x - startPoint.x),
      height: Math.abs(endPoint.y - startPoint.y),
    });

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
    setImageFrame(clampScanArea({
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

  const handleSave = () => {
    if (!pageConfig || !selectedButton) {
      return;
    }

    const normalizedLabel = draftLabel.trim();
    if (designType === "text" && !normalizedLabel) {
      setFeedback("文本按钮内容不能为空。");
      return;
    }
    if (designType === "image" && !isTemplateMode && (!imageSourceDataUrl || polygonPoints.length < 3 || !outputDataUrl)) {
      setFeedback("请先上传图片，并用至少 3 个点圈出图案。");
      return;
    }
    if (designType === "image" && isTemplateMode && !outputDataUrl) {
      setFeedback("请先选择一个有效的按钮模板。");
      return;
    }

    const nextImageDesign: ButtonImageDesign | undefined =
      designType === "image"
        ? {
            sourceDataUrl: imageSourceDataUrl,
            ...(imageSourceName ? { sourceName: imageSourceName } : {}),
            scanArea,
            imageFrame,
            ...(isTemplateMode ? {} : { polygonPoints }),
            whiteTolerance: defaultWhiteTolerance,
            renderWhiteTolerance: defaultRenderWhiteTolerance,
            outputDataUrl,
          }
        : undefined;
    const parentAspectRatio = getButtonParentAspectRatio(pageConfig, selectedButton);
    const positionAspectRatio = parentAspectRatio > 0 ? buttonAspectRatio / parentAspectRatio : buttonAspectRatio;

    const nextPageConfig: PageConfig = {
      ...pageConfig,
      components: pageConfig.components.map((component) =>
        component.id === selectedButton.id && component.type === "button"
          ? {
              ...component,
              label: designType === "text" ? normalizedLabel : component.label,
              imageDesign: nextImageDesign,
              position: designType === "image"
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
                lockAspectRatio: designType === "image" && (!isTemplateMode || isFixedAspectTemplate)
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

  return (
    <section className="button-design-shell">
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
          <button type="button" disabled={!selectedButton} onClick={handleSave}>
            保存按钮美化
          </button>
        </div>
      </div>

      {!pageId ? <p className="feedback error">缺少 pageId，无法进入按钮美化。</p> : null}
      {pageId && !pageConfig ? <p className="feedback error">该页面配置不存在。</p> : null}
      {pageConfig && !selectedButton ? <p className="feedback error">当前组件不是按钮，无法美化。</p> : null}
      {feedback ? <p className="feedback">{feedback}</p> : null}

      {selectedButton ? (
        <div className="button-design-layout">
          <section className="button-design-controls">
            <h3>类型</h3>
            <label className="button-design-field">
              <span>按钮类型</span>
              <select
                value={designType}
                onChange={(event) => {
                  setDesignType(event.target.value as ButtonDesignType);
                  setFeedback("");
                }}
              >
                <option value="text">文本按钮</option>
                <option value="image">图案按钮</option>
              </select>
            </label>
          </section>

          {designType === "text" ? (
            <section className="button-design-text-panel">
              <h3>文本内容</h3>
              <label className="button-design-field">
                <span>显示文本</span>
                <input
                  type="text"
                  value={draftLabel}
                  onChange={(event) => {
                    setDraftLabel(event.target.value);
                    setFeedback("");
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
                  value={draftTextScalePercent}
                  onChange={(event) => {
                    setDraftTextScalePercent(Number(event.target.value));
                    setFeedback("");
                  }}
                />
                <code>{draftTextScalePercent}%</code>
              </label>
            </section>
          ) : null}

          {designType === "image" ? (
            <section className="button-design-source-panel">
              <h3>图案截取</h3>
              <label className="button-design-file-drop">
                <input type="file" accept="image/*" onChange={handleImageSelect} />
                <span>{imageSourceName || "选择一张白底图案图片"}</span>
              </label>
              <label className="button-design-paste-field">
                <span>粘贴图片</span>
                <textarea
                  value={pastedImageValue}
                  onChange={(event) => {
                    setPastedImageValue(event.target.value);
                    setFeedback("");
                  }}
                  onPaste={handlePasteImage}
                  placeholder="在这里 Ctrl+V 粘贴图片，或粘贴 data:image/... 内容"
                />
              </label>
              <button type="button" className="secondary" onClick={handleLoadPastedImage}>
                载入粘贴内容
              </button>
              {imageSourceDataUrl ? (
                <div className="button-design-source-preview">
                  <button
                    type="button"
                    className="button-design-image-stage"
                    onClick={handleImageStageClick}
                    onPointerDown={handleScanAreaDrawStart}
                    onPointerMove={handleScanAreaDrawMove}
                    onPointerUp={handleScanAreaDrawEnd}
                    onPointerCancel={handleScanAreaDrawEnd}
                  >
                    <img src={imageSourceDataUrl} alt="按钮图案素材" />
                    <span
                      className="button-design-scan-area"
                      style={{
                        left: `${scanArea.x}%`,
                        top: `${scanArea.y}%`,
                        width: `${scanArea.width}%`,
                        height: `${scanArea.height}%`,
                      }}
                    />
                    <svg
                      className="button-design-polygon-layer"
                      viewBox="0 0 100 100"
                      aria-hidden="true"
                      onPointerMove={handlePolygonPointMove}
                      onPointerUp={handlePolygonPointDragEnd}
                      onPointerCancel={handlePolygonPointDragEnd}
                    >
                      {polygonPoints.length > 1 ? (
                        <polyline
                          points={polygonPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                          className="button-design-polygon-line"
                        />
                      ) : null}
                      {polygonPoints.length > 2 ? (
                        <polygon
                          points={polygonPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                          className="button-design-polygon-fill"
                        />
                      ) : null}
                      {polygonPoints.map((point, index) => (
                        <circle
                          key={`${point.x}-${point.y}-${index}`}
                          cx={point.x}
                          cy={point.y}
                          r="0.5"
                          onPointerDown={handlePolygonPointPointerDown(index)}
                          onClick={(event) => event.stopPropagation()}
                        />
                      ))}
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="button-design-empty-source">暂无图片</div>
              )}
              <p className="meta">按住图片拖拽，用两个对角点确定自动识别范围。</p>
              <div className="button-design-source-actions">
                <button type="button" disabled={!imageSourceDataUrl} onClick={handleAutoTrace}>
                  自动打点
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={polygonPoints.length === 0}
                  onClick={() => {
                    setPolygonPoints((current) => current.slice(0, -1));
                    setFeedback("");
                  }}
                >
                  撤销点
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={polygonPoints.length === 0}
                  onClick={() => {
                    setPolygonPoints([]);
                    setOutputDataUrl("");
                    setFeedback("");
                  }}
                >
                  重置区域
                </button>
              </div>
              <p className="meta">已选择 {polygonPoints.length} 个点，至少 3 个点可生成闭合图案。</p>
            </section>
          ) : null}

          <section className="button-design-color-panel">
            <h3>纯色</h3>
            <label className="button-design-color-field">
              <span>按钮颜色</span>
              <input
                type="color"
                value={draftBackgroundColor}
                onChange={(event) => {
                  setDraftBackgroundColor(event.target.value);
                  setFeedback("");
                }}
              />
              <code>{draftBackgroundColor}</code>
            </label>
            <label className="button-design-color-field">
              <span>文字颜色</span>
              <input
                type="color"
                value={draftTextColor}
                onChange={(event) => {
                  setDraftTextColor(event.target.value);
                  setFeedback("");
                }}
              />
              <code>{draftTextColor}</code>
            </label>
          </section>

          <section className="button-design-template-panel">
            <h3>按钮模板</h3>
            <label className="button-design-field">
              <span>模板选择</span>
              <select
                value={templateChoice}
                onChange={(event) => {
                  handleTemplateChoiceChange(event.target.value as ButtonTemplateChoice);
                }}
              >
                <option value="custom">自定义</option>
                {buttonTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            {selectedTemplate ? (
              <p className="meta">
                {selectedTemplate.scalingMode === "nineSlice" ? "当前模板为可压缩模板。" : "当前模板为不可压缩模板，按钮宽高比例由模板图片锁定。"}
              </p>
            ) : null}
          </section>

          <section className="button-design-preview-panel">
            <h3>按钮预览</h3>
            <button
              type="button"
              className={`dynamic-ui-button button-design-live-preview ${selectedButton.style?.variant ?? "primary"} ${designType === "image" ? "layout-editing" : ""}`}
              onPointerMove={designType === "image" ? handlePreviewFramePointerMove : undefined}
              onPointerUp={designType === "image" ? handlePreviewFramePointerEnd : undefined}
              onPointerCancel={designType === "image" ? handlePreviewFramePointerEnd : undefined}
              style={{
                backgroundColor: draftBackgroundColor,
                color: draftTextColor,
                ...(designType === "image" ? { width: `${buttonDesignPreviewHeightPx * buttonAspectRatio}px` } : {}),
                ...getButtonTextScaleStyle(selectedButton.position, {
                  ...selectedButton.style,
                  textScalePercent: draftTextScalePercent,
                }),
                ...(typeof selectedButton.style?.borderRadius === "number"
                  ? { borderRadius: `${selectedButton.style.borderRadius}px` }
                  : {}),
              }}
            >
              {designType === "image" && outputDataUrl ? (
                <span
                  className="dynamic-ui-button-image"
                  style={getButtonImageDesignStyle({
                    sourceDataUrl: imageSourceDataUrl,
                    outputDataUrl,
                    imageFrame,
                    polygonPoints,
                    whiteTolerance: defaultWhiteTolerance,
                    renderWhiteTolerance: defaultRenderWhiteTolerance,
                  })}
                  aria-hidden="true"
                />
              ) : null}
              {designType === "text" || !outputDataUrl ? (
                <span className="dynamic-ui-button-content">
                  {selectedButton.icon ? <span className="dynamic-ui-button-icon">{selectedButton.icon}</span> : null}
                  <span>{draftLabel.trim() || selectedButton.label}</span>
                </span>
              ) : null}
              {designType === "image" ? (
                <span className="button-design-button-frame">
                  {isFixedAspectTemplate
                    ? null
                    : (["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((corner) => (
                        <span
                          key={corner}
                          className={`button-design-frame-handle ${corner}`}
                          onPointerDown={handlePreviewFramePointerDown("button", corner)}
                        />
                      ))}
                </span>
              ) : null}
              {designType === "image" ? (
                <span
                  className="button-design-image-frame"
                  style={{
                    left: `${imageFrame.x}%`,
                    top: `${imageFrame.y}%`,
                    width: `${imageFrame.width}%`,
                    height: `${imageFrame.height}%`,
                  }}
                >
                  {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((corner) => (
                    <span
                      key={corner}
                      className={`button-design-frame-handle ${corner}`}
                      onPointerDown={handlePreviewFramePointerDown("image", corner)}
                    />
                  ))}
                </span>
              ) : null}
            </button>
            {designType === "image" ? (
              <p className="meta">
                {isFixedAspectTemplate ? "不可压缩模板下按钮比例已锁定，可拖动内框角点调整图案位置。" : "拖动外框角点调整按钮比例，拖动内框角点调整图案位置。"}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
};
