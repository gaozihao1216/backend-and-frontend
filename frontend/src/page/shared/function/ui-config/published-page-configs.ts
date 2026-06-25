import type { PageConfig } from "../../../../objects/ui-customization/ui-customization-objects.js";
import { normalizePageConfig } from "../../../../objects/ui-customization/page-config-normalizer.js";
import { PageConfigSchema } from "../../../../objects/ui-customization/ui-customization-objects.js";
import { sanitizePageConfigLevelNodeButtons } from "../level-map/level-node-button-format.js";
import { getPageConfig } from "./ui-customization.js";

let publishedRevision = 0;
const publishedPageConfigs = new Map<string, PageConfig>();
const publishedListeners = new Set<() => void>();

const notifyPublishedListeners = () => {
  publishedRevision += 1;
  publishedListeners.forEach((listener) => listener());
};

const parsePublishedPage = (config: PageConfig): PageConfig =>
  PageConfigSchema.parse(sanitizePageConfigLevelNodeButtons(normalizePageConfig(config)));

export const subscribePublishedPageConfigs = (listener: () => void) => {
  publishedListeners.add(listener);
  return () => {
    publishedListeners.delete(listener);
  };
};

export const getPublishedPageConfigRevision = () => publishedRevision;

export const setPublishedPageConfig = (pageId: string, config: PageConfig) => {
  publishedPageConfigs.set(pageId, parsePublishedPage(config));
  notifyPublishedListeners();
};

export const clearPublishedPageConfig = (pageId: string) => {
  if (!publishedPageConfigs.delete(pageId)) {
    return;
  }

  notifyPublishedListeners();
};

export const getPublishedPageConfig = (pageId: string): PageConfig | null =>
  publishedPageConfigs.get(pageId) ?? null;

/** 玩家运行时优先读已发布配置，否则回退本地/默认合并结果。 */
export const getRuntimePageConfig = (pageId: string): PageConfig | null =>
  getPublishedPageConfig(pageId) ?? getPageConfig(pageId);
