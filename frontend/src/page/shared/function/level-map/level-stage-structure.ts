import type { PageConfig, PanelComponent } from "../../../../objects/ui-customization/ui-customization-objects.js";

export { LEVEL_MAP_PAGE_ID } from "../../../../objects/ui-customization/level-map-structure.js";

export const findStagePanel = (pageConfig: PageConfig): PanelComponent | null =>
  pageConfig.components.find(
    (component): component is PanelComponent => component.type === "panel" && component.kind === "stage",
  ) ?? null;

export const countLevelNodes = (stagePanel: PanelComponent): number =>
  stagePanel.childComponentIds.length;
