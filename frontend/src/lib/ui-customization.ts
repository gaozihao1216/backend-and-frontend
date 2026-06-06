import {
  PageConfigSchema,
  getDefaultPageConfigs,
  type PageConfig,
  type UiEndpoint,
} from "../objects/ui-customization/ui-customization-objects.js";
import { normalizePageComponentIds } from "../objects/ui-customization/page-config-normalizer.js";

const UI_PAGE_CONFIG_STORAGE_KEY = "ugc-level-platform.ui-page-configs.v1";

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const parsePageConfigs = (value: unknown): PageConfig[] =>
  PageConfigSchema.array().parse(value).map(normalizePageComponentIds);

const getStoredPageConfigs = (): PageConfig[] => {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(UI_PAGE_CONFIG_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return parsePageConfigs(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
};

const persistStoredPageConfigs = (configs: PageConfig[]) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(UI_PAGE_CONFIG_STORAGE_KEY, JSON.stringify(parsePageConfigs(configs)));
};

const mergePageConfigs = (baseConfigs: PageConfig[], overrideConfigs: PageConfig[]) => {
  const mergedById = new Map(baseConfigs.map((config) => [config.id, config]));

  overrideConfigs.forEach((config) => {
    mergedById.set(config.id, config);
  });

  return [...mergedById.values()];
};

export const listPageConfigs = (): PageConfig[] =>
  mergePageConfigs(getDefaultPageConfigs(), getStoredPageConfigs());

export const listPageConfigsByEndpoint = (endpoint: UiEndpoint): PageConfig[] =>
  listPageConfigs().filter((config) => config.roleScope === endpoint);

export const getPageConfig = (pageId: string): PageConfig | null =>
  listPageConfigs().find((config) => config.id === pageId) ?? null;

export const getDefaultPageConfig = (pageId: string): PageConfig | null =>
  getDefaultPageConfigs().find((config) => config.id === pageId) ?? null;

export const savePageConfig = (config: PageConfig): PageConfig => {
  const parsedConfig = PageConfigSchema.parse(normalizePageComponentIds(config));
  const storedConfigs = getStoredPageConfigs();
  const nextStoredConfigs = [
    ...storedConfigs.filter((candidate) => candidate.id !== parsedConfig.id),
    parsedConfig,
  ];

  persistStoredPageConfigs(nextStoredConfigs);
  return parsedConfig;
};
