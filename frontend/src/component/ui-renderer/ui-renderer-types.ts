import type {
  PageComponent,
  PageConfig,
  PanelComponent,
  UiPreviewUser,
} from "../../objects/ui-customization/ui-customization-objects.js";

export type ComponentMap = Map<string, PageComponent>;

export type DynamicRendererContext = {
  componentMap: ComponentMap;
  openPanelIds: Set<string>;
  controlledPanelIds: Set<string>;
  previewUser?: UiPreviewUser | undefined;
  onNavigate: (path: string) => void;
  onOpenPanel: (panelId: string) => void;
  onClosePanel: (panelId: string) => void;
};

export type DynamicPageRendererProps = {
  page: PageConfig;
  previewUser?: UiPreviewUser | undefined;
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
