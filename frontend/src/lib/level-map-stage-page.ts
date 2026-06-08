import type { PageConfig } from "../objects/ui-customization/ui-customization-objects.js";
import { LEVEL_MAP_PAGE_ID } from "../objects/ui-customization/level-map-structure.js";
import { getPageConfig } from "./ui-customization.js";
import { findStagePanel } from "./level-stage-structure.js";

export const buildSharedLevelMapStagePageConfig = (sourcePage: PageConfig): PageConfig | null => {
  const stagePanel = findStagePanel(sourcePage);
  if (!stagePanel) {
    return null;
  }

  const childIds = new Set(stagePanel.childComponentIds);
  const stageComponents = sourcePage.components.filter(
    (component) => component.id === stagePanel.id || childIds.has(component.id),
  );

  return {
    id: LEVEL_MAP_PAGE_ID,
    name: stagePanel.title ?? "关卡路径地图",
    path: sourcePage.path,
    roleScope: "player",
    layout: { type: "freeform" },
    surfaceMode: "composed",
    components: stageComponents.map((component) => {
      if (component.type === "panel" && component.kind === "stage") {
        return {
          ...component,
          position: {
            unit: "percent" as const,
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          },
        };
      }

      return component;
    }),
  };
};

export const getSharedLevelMapStagePageConfig = (): PageConfig | null => {
  const sharedPage = getPageConfig(LEVEL_MAP_PAGE_ID);
  if (!sharedPage) {
    return null;
  }

  return buildSharedLevelMapStagePageConfig(sharedPage);
};
