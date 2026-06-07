import type {
  ButtonComponent,
  PageComponent,
  PageConfig,
  PanelComponent,
} from "../../objects/ui-customization/ui-customization-objects.js";

const hasApiDataSource = (
  component: PageComponent,
): component is ButtonComponent | PanelComponent =>
  (component.type === "button" || component.type === "panel")
  && component.dataSource?.type === "api"
  && Boolean(component.dataSource.apiKey);

export const collectComponentUiDataKeys = (component: PageComponent): string[] => {
  const keys: string[] = [];

  if (hasApiDataSource(component)) {
    keys.push(component.dataSource!.apiKey!);
  }

  if (component.type === "button" && component.stateDesign?.stateSource?.apiKey) {
    keys.push(component.stateDesign.stateSource.apiKey);
  }

  return keys;
};

export const collectPageUiDataKeys = (page: PageConfig): string[] => {
  const keys = new Set<string>();
  page.components.forEach((component) => {
    collectComponentUiDataKeys(component).forEach((key) => keys.add(key));
  });
  return [...keys];
};

export const collectPanelOpenRefreshKeys = (
  page: PageConfig,
  openPanelIds: Set<string>,
): string[] => {
  const keys = new Set<string>();

  page.components.forEach((component) => {
    if (component.type !== "panel" || !openPanelIds.has(component.id)) {
      return;
    }

    component.childComponentIds.forEach((childId) => {
      const child = page.components.find((candidate) => candidate.id === childId);
      if (!child || !hasApiDataSource(child) || child.dataSource!.refreshMode !== "onOpen") {
        return;
      }

      keys.add(child.dataSource!.apiKey!);
    });
  });

  return [...keys];
};
