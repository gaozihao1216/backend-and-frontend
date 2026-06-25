import type { UiButtonTemplate } from "../../../../objects/api/api-contracts.js";
import {
  DEFAULT_BUTTON_TEMPLATE_CATEGORY,
  normalizeButtonTemplateCategory,
} from "../../../../objects/ui/category/template-category.js";
import type { ImageBounds, ImageSize, TemplateDraft } from "../objects/button-template-types.js";

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

export const defaultPanelTemplateDataUrl = (() => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="420" height="280" viewBox="0 0 420 280">
      <rect x="12" y="12" width="396" height="256" rx="28" fill="#ffffff" stroke="#94a3b8" stroke-width="8"/>
      <rect x="28" y="28" width="364" height="56" rx="16" fill="#dbeafe"/>
      <rect x="28" y="96" width="364" height="156" rx="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
})();

export const defaultPatternTemplateDataUrl = (() => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="56" fill="#fde68a" stroke="#f59e0b" stroke-width="8"/>
      <path d="M80 34l12 28h29l-23 18 9 29-27-17-27 17 9-29-23-18h29z" fill="#f97316"/>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
})();

export const createDefaultDraft = (): TemplateDraft => ({
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

export const createDraftFromTemplate = (template: UiButtonTemplate): TemplateDraft => ({
  id: template.id,
  name: template.name,
  sourceDataUrl: template.sourceDataUrl,
  category: normalizeButtonTemplateCategory(template.category),
  scalingMode: template.scalingMode,
  slice: { ...template.slice },
});

export const createTemplateFromDraft = (draft: TemplateDraft): UiButtonTemplate => ({
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

export const detectVisibleImageBounds = async (dataUrl: string): Promise<{ imageSize: ImageSize; bounds: ImageBounds }> => {
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

export const getVisibleBoundsStyle = (previewImageBounds: ImageBounds, previewImageSize: ImageSize) => ({
  left: `${(previewImageBounds.x / previewImageSize.width) * 100}%`,
  top: `${(previewImageBounds.y / previewImageSize.height) * 100}%`,
  width: `${(previewImageBounds.width / previewImageSize.width) * 100}%`,
  height: `${(previewImageBounds.height / previewImageSize.height) * 100}%`,
});

export const getVerticalSlicePercent = (
  key: "left" | "right",
  draft: TemplateDraft,
  previewImageBounds: ImageBounds,
) => {
  const value = draft.slice[key];
  const percent = previewImageBounds.width > 0 ? (value / previewImageBounds.width) * 100 : 0;
  return key === "left" ? percent : 100 - percent;
};

export const getHorizontalSlicePercent = (
  key: "top" | "bottom",
  draft: TemplateDraft,
  previewImageBounds: ImageBounds,
) => {
  const value = draft.slice[key];
  const percent = previewImageBounds.height > 0 ? (value / previewImageBounds.height) * 100 : 0;
  return key === "top" ? percent : 100 - percent;
};
