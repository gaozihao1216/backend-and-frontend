import { LEVEL_MAP_PAGE_ID } from "../objects/ui-customization/level-map-structure.js";
import type { PageConfig } from "../objects/ui-customization/ui-customization-objects.js";
import { mergeSharedLevelMapPageConfig } from "./merge-shared-level-map-page.js";
import { getPublishedPageConfig } from "./published-page-configs.js";
import { hydratePublishedPageFromApi, publishUiPageConfig } from "./ui-page-publish.js";
import { getPageConfig, savePageConfig } from "./ui-customization.js";

let persistenceUserId: string | null = null;

export const setSharedLevelMapPersistenceUser = (userId: string | null) => {
  persistenceUserId = userId;
};

const persistSharedLevelMapToApi = async (page: PageConfig) => {
  if (!persistenceUserId || page.id !== LEVEL_MAP_PAGE_ID) {
    return;
  }

  try {
    await publishUiPageConfig(persistenceUserId, page);
  } catch {
    // Local config is still saved; API publish can retry on the next save.
  }
};

export const hydrateSharedLevelMapFromApi = async (userId: string): Promise<boolean> => {
  setSharedLevelMapPersistenceUser(userId);
  const hydrated = await hydratePublishedPageFromApi(userId, LEVEL_MAP_PAGE_ID);
  if (!hydrated) {
    return false;
  }

  const publishedPage = getPublishedPageConfig(LEVEL_MAP_PAGE_ID);
  if (!publishedPage) {
    return false;
  }

  const localPage = getPageConfig(LEVEL_MAP_PAGE_ID);
  savePageConfig(mergeSharedLevelMapPageConfig(localPage, publishedPage));
  return true;
};

export const saveSharedLevelMapPage = (page: PageConfig): PageConfig => {
  const savedPage = savePageConfig(page);
  void persistSharedLevelMapToApi(savedPage);
  return savedPage;
};
