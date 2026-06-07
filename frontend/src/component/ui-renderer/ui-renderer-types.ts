import type {
  PageComponent,
  PageConfig,
  PanelComponent,
  UiPreviewUser,
} from "../../objects/ui-customization/ui-customization-objects.js";

export type ComponentMap = Map<string, PageComponent>;

export type UiPageRuntime = {
  uiData: Record<string, unknown>;
  refreshUiData: (targetKeys?: string[]) => Promise<void>;
  invokeUiAction: (apiKey: string, params?: Record<string, string>) => Promise<Record<string, unknown> | null>;
};

export type DynamicRendererContext = {
  componentMap: ComponentMap;
  openPanelIds: Set<string>;
  controlledPanelIds: Set<string>;
  previewUser?: UiPreviewUser | undefined;
  runtimeUserId?: string | undefined;
  uiRuntime?: UiPageRuntime | undefined;
  onNavigate: (path: string) => void;
  onOpenPanel: (panelId: string) => void;
  onClosePanel: (panelId: string) => void;
};

export type DynamicPageRendererProps = {
  page: PageConfig;
  previewUser?: UiPreviewUser | undefined;
  runtimeUserId?: string | undefined;
  previewUiData?: Record<string, unknown> | undefined;
  onNavigate: (path: string) => void;
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
