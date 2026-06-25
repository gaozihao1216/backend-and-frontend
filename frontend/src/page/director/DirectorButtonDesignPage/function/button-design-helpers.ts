import type { ButtonComponent, ImageCrop, ImagePolygonPoint, PageConfig } from "../../../../objects/ui-customization/ui-customization-objects.js";
import {
  defaultWhiteTolerance,
  maxImageFrameOverflowPercent,
  maxImageFramePercent,
} from "../objects/button-design-types.js";

/**
 * 按钮图片设计辅助函数。
 *
 * 支持从图片中扫描轮廓、生成多边形裁剪图，并根据按钮父面板比例计算预览尺寸。
 */
export const getImageAspectRatio = async (dataUrl: string): Promise<number> => {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  return image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : 1;
};

export const findButton = (pageConfig: PageConfig | null, componentId: string | null): ButtonComponent | null => {
  const component = componentId ? pageConfig?.components.find((candidate) => candidate.id === componentId) : null;
  return component?.type === "button" ? component : null;
};

export const clampScanArea = (scanArea: ImageCrop): ImageCrop => {
  const width = Math.min(100, Math.max(1, scanArea.width));
  const height = Math.min(100, Math.max(1, scanArea.height));
  return {
    x: Math.min(100 - width, Math.max(0, scanArea.x)),
    y: Math.min(100 - height, Math.max(0, scanArea.y)),
    width,
    height,
  };
};

export const clampImageFrame = (frame: ImageCrop): ImageCrop => {
  const width = Math.min(maxImageFramePercent, Math.max(1, frame.width));
  const height = Math.min(maxImageFramePercent, Math.max(1, frame.height));
  return {
    x: Math.min(maxImageFramePercent - width, Math.max(-maxImageFrameOverflowPercent, frame.x)),
    y: Math.min(maxImageFramePercent - height, Math.max(-maxImageFrameOverflowPercent, frame.y)),
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

export const getButtonParentAspectRatio = (pageConfig: PageConfig | null, button: ButtonComponent | null) => {
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

export const getRenderedButtonAspectRatio = (
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

/** 按多边形点裁剪图片，输出可直接写入按钮模板的 dataUrl。 */
export const renderPolygonImage = async (
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

/** 横向扫描非白色像素，生成贴合按钮主体边缘的多边形。 */
export const generateRowBoundaryPolygon = async (
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

export const createScanAreaFromPoints = (startPoint: ImagePolygonPoint, endPoint: ImagePolygonPoint) =>
  clampScanArea({
    x: Math.min(startPoint.x, endPoint.x),
    y: Math.min(startPoint.y, endPoint.y),
    width: Math.abs(endPoint.x - startPoint.x),
    height: Math.abs(endPoint.y - startPoint.y),
  });
