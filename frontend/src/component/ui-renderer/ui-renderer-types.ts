import type { PointerEvent } from "react";
import type { ComponentResizeHandle } from "../../lib/component-position-adjust.js";
import type {
  PageComponent,
  PageConfig,
  PageLayoutType,
  PanelComponent,
  UiPreviewUser,
} from "../../objects/ui-customization/ui-customization-objects.js";

export type LevelMapLayoutEditContext = {
  enabled: true;
  selectedLevelSuffix: string | null;
  onSelect: (levelSuffix: string) => void;
  onBeginMove: (levelSuffix: string, event: PointerEvent<HTMLButtonElement>) => void;
  onBeginResize: (
    levelSuffix: string,
    handle: ComponentResizeHandle,
    event: PointerEvent<HTMLSpanElement>,
  ) => void;
};

export type ComponentMap = Map<string, PageComponent>;

export type UiPageRuntime = {
  uiData: Record<string, unknown>;
  refreshUiData: (targetKeys?: string[]) => Promise<void>;
  invokeUiAction: (apiKey: string, params?: Record<string, string>) => Promise<Record<string, unknown> | null>;
};

export type LevelMapPathEditContext = {
  enabled: true;
  selectedEdgeId: string | null;
  connectFromSuffix: string | null;
  onSelectEdge: (edgeId: string | null) => void;
  onConnectNode: (levelSuffix: string) => void;
};

export type DynamicRendererContext = {
  componentMap: ComponentMap;
  openPanelIds: Set<string>;
  controlledPanelIds: Set<string>;
  layoutType: PageLayoutType;
  roleHomeSurface?: boolean | undefined;
  fitStageToHost?: boolean | undefined;
  previewUser?: UiPreviewUser | undefined;
  runtimeUserId?: string | undefined;
  uiRuntime?: UiPageRuntime | undefined;
  levelMapLayoutEdit?: LevelMapLayoutEditContext | undefined;
  levelMapPathEdit?: LevelMapPathEditContext | undefined;
  onNavigate: (path: string) => void;
  onOpenPanel: (panelId: string) => void;
  onClosePanel: (panelId: string) => void;
  onOpenSettings?: (() => void) | undefined;
  onLogout?: (() => void) | undefined;
};

export type DynamicPageRendererProps = {
  page: PageConfig;
  previewUser?: UiPreviewUser | undefined;
  runtimeUserId?: string | undefined;
  previewUiData?: Record<string, unknown> | undefined;
  onNavigate: (path: string) => void;
  onOpenSettings?: (() => void) | undefined;
  onLogout?: (() => void) | undefined;
  fitStageToHost?: boolean | undefined;
  levelMapLayoutEdit?: LevelMapLayoutEditContext | undefined;
  levelMapPathEdit?: LevelMapPathEditContext | undefined;
};

export type DynamicComponentRendererProps = {
  component: PageComponent;
  context: DynamicRendererContext;
  visitedComponentIds?: Set<string>;
  floating?: boolean | undefined;
};

export type DynamicPanelProps = {
  panel: PanelComponent;
  context: DynamicRendererContext;
  visitedComponentIds: Set<string>;
  floating?: boolean;
};
