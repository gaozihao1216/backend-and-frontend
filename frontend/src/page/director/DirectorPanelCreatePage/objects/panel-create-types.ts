import type { PointerEvent } from "react";
import type {
  ButtonBaseDesign,
  ButtonStateOption,
  ComponentPosition,
  ComponentStyle,
  PageComponent,
  PageConfig,
  PanelComponent,
  PanelDecoration,
  PlayerCurrencyReward,
  StretchVisualDesign,
  TextArtDesign,
} from "../../../../objects/ui-customization/ui-customization-objects.js";
import type { ButtonPatternLayerDraft, PatternLayerResizeHandle } from "../../../../lib/button-pattern-layers.js";

export type DirectorPanelCreatePageProps = {
  userId: string;
  pageId: string | null;
  targetPath: string;
  parentPanelId: string | null;
  onBack: () => void;
  onNavigate: (nextPath: string) => void;
};

export type CreateStep = "basic" | "beauty" | "rewardConfig" | "buttonDesign";
export type PanelPreset = "checkIn" | "blank";
export type ResizeHandle = PatternLayerResizeHandle;
export type PositionDraft = Pick<ComponentPosition, "x" | "y" | "width" | "height">;
export type DragState =
  | {
      mode: "move";
      pointerId: number;
      startX: number;
      startY: number;
      startPosition: PositionDraft;
      stageWidth: number;
      stageHeight: number;
    }
  | {
      mode: "resize";
      handle: ResizeHandle;
      pointerId: number;
      startX: number;
      startY: number;
      startPosition: PositionDraft;
      stageWidth: number;
      stageHeight: number;
    };
export type ChildPointerGesture =
  | {
      mode: "click";
      x: number;
      y: number;
      pointerId: number;
      childId: string | null;
    }
  | {
      mode: "move-selected";
      childId: string;
      x: number;
      y: number;
      lastX: number;
      lastY: number;
      pointerId: number;
      parentWidth: number;
      parentHeight: number;
    }
  | {
      mode: "resize-selected";
      childId: string;
      handle: ResizeHandle;
      x: number;
      y: number;
      lastX: number;
      lastY: number;
      pointerId: number;
      parentWidth: number;
      parentHeight: number;
    };

export type ButtonStateDraft = {
  id: string;
  name: string;
  label: string;
  contentType: "text" | "pattern";
  icon: string;
  baseTemplateValue: string;
  patternTemplateValue: string;
  baseTemplateId?: NonNullable<ButtonStateOption["baseTemplateId"]>;
  patternTemplateId?: NonNullable<ButtonStateOption["patternTemplateId"]>;
  baseDesign?: ButtonBaseDesign;
  patternDesign?: StretchVisualDesign;
  patternLayers: ButtonPatternLayerDraft[];
  variant: NonNullable<ComponentStyle["variant"]>;
  backgroundColor: string;
  textColor: string;
};

export type PanelChildDraft =
  | {
      id: string;
      type: "text";
      text: string;
      position: PositionDraft;
      artTextDesign?: TextArtDesign;
    }
  | {
      id: string;
      type: "subPanel";
      title: string;
      decoration: PanelDecoration;
      position: PositionDraft;
    }
  | {
      id: string;
      type: "multiStateButton";
      name: string;
      position: PositionDraft;
      defaultStateId: string;
      states: ButtonStateDraft[];
      rewardGrant?: PlayerCurrencyReward;
    };

export type PatternAdjustRefState =
  | {
      mode: "move";
      stateId: string;
      layerId: string;
      pointerId: number;
      startX: number;
      startY: number;
      startFrame: import("../../../../objects/ui-customization/ui-customization-objects.js").ButtonImageFrame;
      stageWidth: number;
      stageHeight: number;
    }
  | {
      mode: "resize";
      handle: ResizeHandle;
      stateId: string;
      layerId: string;
      pointerId: number;
      startX: number;
      startY: number;
      startFrame: import("../../../../objects/ui-customization/ui-customization-objects.js").ButtonImageFrame;
      stageWidth: number;
      stageHeight: number;
    };

export const CLICK_DRAG_THRESHOLD_PX = 6;
export const pagePreviewAspectRatio = 16 / 9;
