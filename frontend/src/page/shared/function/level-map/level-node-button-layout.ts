import { getPageConfig } from "../ui-config/ui-customization.js";
import { saveSharedLevelMapPage } from "../ui-config/shared-level-map-persistence.js";
import { LEVEL_MAP_PAGE_ID } from "../../../../objects/ui-customization/level-map-structure.js";
import {
  getLevelSuffixFromNodeButton,
  isLevelNodeButtonComponent,
} from "./level-node-button-format.js";
import type {
  ComponentPosition,
  PageConfig,
} from "../../../../objects/ui-customization/ui-customization-objects.js";

export type LevelNodeButtonLayoutMap = Record<string, ComponentPosition>;

export const extractLevelNodeButtonLayouts = (pageConfig: PageConfig): LevelNodeButtonLayoutMap => {
  const layouts: LevelNodeButtonLayoutMap = {};

  pageConfig.components.forEach((component) => {
    if (!isLevelNodeButtonComponent(component)) {
      return;
    }

    const suffix = getLevelSuffixFromNodeButton(component);
    if (suffix) {
      layouts[suffix] = component.position;
    }
  });

  return layouts;
};

export const applyLevelNodeButtonLayouts = (
  pageConfig: PageConfig,
  layouts: LevelNodeButtonLayoutMap,
): PageConfig => ({
  ...pageConfig,
  components: pageConfig.components.map((component) => {
    if (!isLevelNodeButtonComponent(component)) {
      return component;
    }

    const suffix = getLevelSuffixFromNodeButton(component);
    if (!suffix || !layouts[suffix]) {
      return component;
    }

    return {
      ...component,
      position: layouts[suffix],
    };
  }),
});

export const updateLevelNodeButtonPositionInPage = (
  pageConfig: PageConfig,
  levelSuffix: string,
  position: ComponentPosition,
): PageConfig => applyLevelNodeButtonLayouts(pageConfig, {
  ...extractLevelNodeButtonLayouts(pageConfig),
  [levelSuffix]: position,
});

export const syncLevelNodeButtonLayout = (layouts: LevelNodeButtonLayoutMap): PageConfig[] => {
  const pageConfig = getPageConfig(LEVEL_MAP_PAGE_ID);
  if (!pageConfig) {
    return [];
  }

  return [saveSharedLevelMapPage(applyLevelNodeButtonLayouts(pageConfig, layouts))];
};
