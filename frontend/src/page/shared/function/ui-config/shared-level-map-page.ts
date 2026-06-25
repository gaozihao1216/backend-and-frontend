import type { PageConfig } from "../../../../objects/ui-customization/ui-customization-objects.js";
import { LEVEL_MAP_PAGE_ID } from "../../../../objects/ui-customization/level-map-structure.js";
import { getDefaultPageConfig, getPageConfig } from "./ui-customization.js";
import { getRuntimePageConfig } from "./published-page-configs.js";

/** Canonical shared level map page config — prefers published server config when available. */
export const getSharedLevelMapPageConfig = (): PageConfig | null =>
  getRuntimePageConfig(LEVEL_MAP_PAGE_ID) ?? getPageConfig(LEVEL_MAP_PAGE_ID) ?? getDefaultPageConfig(LEVEL_MAP_PAGE_ID) ?? null;
