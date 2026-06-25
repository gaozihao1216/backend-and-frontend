import type { getUiPreviewUser, PageComponent } from "../../../../objects/ui-customization/ui-customization-objects.js";
import type { PageConfig } from "../../../../objects/ui-customization/ui-customization-objects.js";

export type DirectorPageBuilderPageProps = {
  userId: string;
  pageId: string | null;
  targetPath?: string;
  onBack: () => void;
  onNavigate: (nextPath: string) => void;
};

export type OutlineSelectionState = "idle" | "pending" | "selected";

export type ResizeHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type PointerGestureState =
  | {
      mode: "click";
      x: number;
      y: number;
      pointerId: number;
    }
  | {
      mode: "move-selected";
      componentId: string;
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
      componentId: string;
      handle: ResizeHandle;
      x: number;
      y: number;
      lastX: number;
      lastY: number;
      pointerId: number;
      parentWidth: number;
      parentHeight: number;
    }
  | {
      mode: "selected-text";
      componentId: string;
      x: number;
      y: number;
      lastX: number;
      lastY: number;
      pointerId: number;
      parentWidth: number;
      parentHeight: number;
    };

export const CLICK_DRAG_THRESHOLD_PX = 6;

export type PageBuilderComponentNodeProps = {
  component: PageComponent;
  componentMap: Map<string, PageComponent>;
  controlledPanelIds: Set<string>;
  openPanelIds: Set<string>;
  previewUser: ReturnType<typeof getUiPreviewUser>;
  outlinedComponentIds: Set<string>;
  pendingComponentId: string | null;
  selectedComponentId: string | null;
  editingTextComponentId: string | null;
  onTogglePanel: (panelId: string) => void;
  onResizeSelectedComponent: (
    componentId: string,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
    parentWidth: number,
    parentHeight: number,
  ) => void;
  onTextChange: (componentId: string, text: string) => void;
  onTextEditEnd: () => void;
  visitedComponentIds?: Set<string>;
};

export type PageBuilderTextNodeProps = {
  component: Extract<PageComponent, { type: "text" }>;
  previewUser: ReturnType<typeof getUiPreviewUser>;
  showOutline: boolean;
  selectionState: OutlineSelectionState;
  isSelected: boolean;
  isEditing: boolean;
  onTextChange: (componentId: string, text: string) => void;
  onTextEditEnd: () => void;
};

export type PageBuilderPreviewProps = {
  pageConfig: PageConfig;
  controlledPanelIds: Set<string>;
  openPanelIds: Set<string>;
  previewUser: ReturnType<typeof getUiPreviewUser>;
  outlinedComponentIds: Set<string>;
  pendingComponentId: string | null;
  selectedComponentId: string | null;
  editingTextComponentId: string | null;
  onTogglePanel: (panelId: string) => void;
  onOutlineClick: (componentId: string) => void;
  onOutlineMiss: () => void;
  onStartTextEditing: (componentId: string) => void;
  onMoveSelectedComponent: (
    componentId: string,
    deltaX: number,
    deltaY: number,
    parentWidth: number,
    parentHeight: number,
  ) => void;
  onResizeSelectedComponent: (
    componentId: string,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
    parentWidth: number,
    parentHeight: number,
  ) => void;
  onTextChange: (componentId: string, text: string) => void;
  onTextEditEnd: () => void;
};
