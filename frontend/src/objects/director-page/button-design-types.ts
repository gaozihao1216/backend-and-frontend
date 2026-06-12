import type { ImageCrop, ImagePolygonPoint } from "../ui-customization/ui-customization-objects.js";

export type DirectorButtonDesignPageProps = {
  userId: string;
  pageId: string | null;
  componentId: string | null;
  onBack: () => void;
};

export type ButtonDesignType = "text" | "image";
export type ButtonTemplateChoice = "custom" | string;

export type ScanAreaDrawState = {
  startPoint: ImagePolygonPoint;
};

export type FrameCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type PreviewFrameDragState =
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

export const defaultStaticButtonBackgroundColor = "#ffbe5c";
export const defaultStaticButtonTextColor = "#fff9ef";
export const defaultTextScalePercent = 42;
export const defaultWhiteTolerance = 22;
export const defaultRenderWhiteTolerance = -1;
export const defaultAutoScanStep = 21;
export const maxImageFramePercent = 125;
export const maxImageFrameOverflowPercent = 25;
export const buttonDesignPreviewHeightPx = 132;

export const defaultScanArea: ImageCrop = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

export const defaultImageFrame: ImageCrop = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};
