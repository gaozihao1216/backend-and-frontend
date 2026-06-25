import type { PageConfig } from "../../../../objects/ui-customization/ui-customization-objects.js";
import { applyLevelStageDecoration } from "./level-stage-background.js";
import { findStagePanel } from "./level-stage-structure.js";
import { hasStoredPageConfig } from "../ui-config/ui-customization.js";
import { LEVEL_MAP_PAGE_ID } from "../../../../objects/ui-customization/level-map-structure.js";

export const mergeSharedLevelMapPageConfig = (
  localPage: PageConfig | null,
  remotePage: PageConfig,
): PageConfig => {
  if (!localPage) {
    return remotePage;
  }

  const localDecoration = findStagePanel(localPage)?.decoration;
  if (!localDecoration) {
    return remotePage;
  }

  // Local shared.levelMap overrides win for stage background. Remote pages often carry
  // stale/default decoration while buttons/pathDesign are already synced via API.
  if (hasStoredPageConfig(LEVEL_MAP_PAGE_ID)) {
    return applyLevelStageDecoration(remotePage, localDecoration);
  }

  const remoteDecoration = findStagePanel(remotePage)?.decoration;
  if (!remoteDecoration) {
    return applyLevelStageDecoration(remotePage, localDecoration);
  }

  return remotePage;
};
