import { createUiPage } from "../api/ui/pages/CreateUiPageApi.js";
import { getSharedLevelMapPage } from "../api/ui/pages/GetSharedLevelMapPageApi.js";
import { updateUiPage } from "../api/ui/pages/UpdateUiPageApi.js";
import { LEVEL_MAP_PAGE_ID } from "../objects/ui-customization/level-map-structure.js";
import type { PageConfig } from "../objects/ui-customization/ui-customization-objects.js";
import { savePageConfig } from "./ui-customization.js";

let persistenceUserId: string | null = null;

export const setSharedLevelMapPersistenceUser = (userId: string | null) => {
  persistenceUserId = userId;
};

const persistSharedLevelMapToApi = async (page: PageConfig) => {
  if (!persistenceUserId || page.id !== LEVEL_MAP_PAGE_ID) {
    return;
  }

  try {
    await updateUiPage(persistenceUserId, LEVEL_MAP_PAGE_ID, page);
    return;
  } catch {
    // Upsert on first save when the page row does not exist yet.
  }

  try {
    await createUiPage(persistenceUserId, page);
  } catch {
    // Local config is still saved; API persistence can retry on the next save.
  }
};

export const hydrateSharedLevelMapFromApi = async (userId: string): Promise<boolean> => {
  setSharedLevelMapPersistenceUser(userId);

  try {
    const remotePage = await getSharedLevelMapPage(userId);
    savePageConfig(remotePage);
    return true;
  } catch {
    return false;
  }
};

export const saveSharedLevelMapPage = (page: PageConfig): PageConfig => {
  const savedPage = savePageConfig(page);
  void persistSharedLevelMapToApi(savedPage);
  return savedPage;
};
