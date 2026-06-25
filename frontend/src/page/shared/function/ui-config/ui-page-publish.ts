import { getPlayerUiPage } from "../../../../api/ui/pages/runtime/GetPlayerUiPageApi.js";
import { publishUiPage } from "../../../../api/ui/pages/publishing/PublishUiPageApi.js";
import { rollbackUiPage } from "../../../../api/ui/pages/publishing/RollbackUiPageApi.js";
import type { PageConfig } from "../../../../objects/ui-customization/ui-customization-objects.js";
import {
  getPublishedPageConfigRevision,
  setPublishedPageConfig,
} from "./published-page-configs.js";
import { savePageConfig } from "./ui-customization.js";

/**
 * PageConfig 发布/回滚 API 适配层。
 *
 * director 编辑的是本地覆盖配置；发布后玩家侧通过 published-page-configs 缓存读取后端版本。
 */
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

/** 将当前本地 PageConfig 发布到后端，成功后同步写入前端 published 缓存。 */
export const publishUiPageConfig = async (
  userId: string,
  page: PageConfig,
): Promise<PageConfig> => {
  savePageConfig(page);
  const publishedPage = await publishUiPage(userId, page.id, page);
  setPublishedPageConfig(page.id, publishedPage);
  return publishedPage;
};

/** 回滚后把后端恢复出的配置同步写回本地编辑态和 published 缓存。 */
export const rollbackUiPageConfig = async (
  userId: string,
  pageId: string,
): Promise<PageConfig> => {
  const restoredPage = await rollbackUiPage(userId, pageId);
  savePageConfig(restoredPage);
  setPublishedPageConfig(pageId, restoredPage);
  return restoredPage;
};
