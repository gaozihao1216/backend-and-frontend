import type { PageConfig } from "../objects/ui-customization/ui-customization-objects.js";
import { LEVEL_MAP_PAGE_ID } from "../objects/ui-customization/level-map-structure.js";
import { getDefaultPageConfig, getPageConfig } from "./ui-customization.js";

/** Canonical shared level map page config — same object director preview and role homes must use. */
export const getSharedLevelMapPageConfig = (): PageConfig | null =>
  getPageConfig(LEVEL_MAP_PAGE_ID) ?? getDefaultPageConfig(LEVEL_MAP_PAGE_ID) ?? null;
