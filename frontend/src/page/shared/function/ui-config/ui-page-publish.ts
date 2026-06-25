import { getPlayerUiPage } from "../../../../api/ui/pages/runtime/GetPlayerUiPageApi.js";
import { publishUiPage } from "../../../../api/ui/pages/publishing/PublishUiPageApi.js";
import { rollbackUiPage } from "../../../../api/ui/pages/publishing/RollbackUiPageApi.js";
import type { PageConfig } from "../../../../objects/ui-customization/ui-customization-objects.js";
import {
  getPublishedPageConfigRevision,
  setPublishedPageConfig,
} from "./published-page-configs.js";
import { savePageConfig } from "./ui-customization.js";

export const hydratePublishedPageFromApi = async (
  userId: string,
  pageId: string,
): Promise<boolean> => {
  const revisionBefore = getPublishedPageConfigRevision();

  try {
    const remotePage = await getPlayerUiPage(userId, pageId);
    if (getPublishedPageConfigRevision() !== revisionBefore) {
      return true;
    }

    setPublishedPageConfig(pageId, remotePage);
    return true;
  } catch {
    return false;
  }
};

export const publishUiPageConfig = async (
  userId: string,
  page: PageConfig,
): Promise<PageConfig> => {
  savePageConfig(page);
  const publishedPage = await publishUiPage(userId, page.id, page);
  setPublishedPageConfig(page.id, publishedPage);
  return publishedPage;
};

export const rollbackUiPageConfig = async (
  userId: string,
  pageId: string,
): Promise<PageConfig> => {
  const restoredPage = await rollbackUiPage(userId, pageId);
  savePageConfig(restoredPage);
  setPublishedPageConfig(pageId, restoredPage);
  return restoredPage;
};
