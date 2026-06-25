import {
  PageConfigSchema,
  getDefaultPageConfigs,
  type PageConfig,
  type PanelDecoration,
  type UiEndpoint,
} from "../../../../objects/ui-customization/ui-customization-objects.js";
import { normalizePageConfig } from "../../../../objects/ui-customization/page-config-normalizer.js";
import { LEVEL_MAP_PAGE_ID } from "../../../../objects/ui-customization/level-map-structure.js";
import { ROLE_LEVEL_MAP_SYNC_PAGE_IDS } from "../level-map/level-map-sync.js";
import { sanitizePageConfigLevelNodeButtons } from "../level-map/level-node-button-format.js";
import { saveVisualAsset } from "./ui-visual-asset-store.js";

const UI_PAGE_CONFIG_STORAGE_KEY = "ugc-level-platform.ui-page-configs.v1";

let pageConfigRevision = 0;
const pageConfigListeners = new Set<() => void>();

const notifyPageConfigListeners = () => {
  pageConfigRevision += 1;
  pageConfigListeners.forEach((listener) => listener());
};

export const subscribePageConfigStore = (listener: () => void) => {
  pageConfigListeners.add(listener);
  return () => {
    pageConfigListeners.delete(listener);
  };
};

export const getPageConfigRevision = () => pageConfigRevision;

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const parsePageConfigs = (value: unknown): PageConfig[] =>
  PageConfigSchema.array()
    .parse(value)
    .map(normalizePageConfig)
    .map(sanitizePageConfigLevelNodeButtons);

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

const compactStagePanelDecoration = async (decoration: PanelDecoration | undefined): Promise<PanelDecoration | undefined> => {
  if (!decoration?.backgroundDesign?.sourceDataUrl) {
    return decoration;
  }

  await saveVisualAsset(decoration.backgroundDesign.templateId, decoration.backgroundDesign.sourceDataUrl);

  return {
    ...decoration,
    backgroundDesign: {
      templateId: decoration.backgroundDesign.templateId,
      ...(decoration.backgroundDesign.frame ? { frame: decoration.backgroundDesign.frame } : {}),
    },
  };
};

const compactPageConfigStageBackgrounds = async (config: PageConfig): Promise<PageConfig> => {
  let changed = false;

  const components = await Promise.all(config.components.map(async (component) => {
    if (component.type !== "panel" || component.kind !== "stage" || !component.decoration?.backgroundDesign?.sourceDataUrl) {
      return component;
    }

    changed = true;
    const nextDecoration = await compactStagePanelDecoration(component.decoration);
    return {
      ...component,
      ...(nextDecoration ? { decoration: nextDecoration } : {}),
    };
  }));

  return changed ? { ...config, components } : config;
};

export const compactStoredPageConfigVisualAssets = async (): Promise<boolean> => {
  const pageIds = getStoredPageConfigs().map((config) => config.id);
  if (pageIds.length === 0) {
    return false;
  }

  let changed = false;

  for (const pageId of pageIds) {
    const latest = getStoredPageConfigs().find((config) => config.id === pageId);
    if (!latest) {
      continue;
    }

    const compacted = await compactPageConfigStageBackgrounds(latest);
    if (compacted === latest) {
      continue;
    }

    savePageConfig(compacted);
    changed = true;
  }

  return changed;
};

export const compactStoredRoleHomePageConfigs = (): boolean => {
  if (!canUseStorage()) {
    return false;
  }

  const raw = window.localStorage.getItem(UI_PAGE_CONFIG_STORAGE_KEY);
  if (!raw) {
    return false;
  }

  let parsedConfigs: PageConfig[];
  try {
    parsedConfigs = PageConfigSchema.array().parse(JSON.parse(raw) as unknown);
  } catch {
    return false;
  }

  const pageIdsToCompact = new Set<string>([
    LEVEL_MAP_PAGE_ID,
    ...ROLE_LEVEL_MAP_SYNC_PAGE_IDS,
  ]);

  let changed = false;
  const nextConfigs = parsedConfigs.map((config) => {
    if (!pageIdsToCompact.has(config.id)) {
      return config;
    }

    const normalized = PageConfigSchema.parse(
      sanitizePageConfigLevelNodeButtons(normalizePageConfig(config)),
    );
    if (JSON.stringify(config) !== JSON.stringify(normalized)) {
      changed = true;
    }

    return normalized;
  });

  if (!changed) {
    return false;
  }

  try {
    persistStoredPageConfigs(nextConfigs);
  } catch {
    return false;
  }

  notifyPageConfigListeners();
  return true;
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

export const getRawPageConfig = (pageId: string): PageConfig | null =>
  listPageConfigs().find((config) => config.id === pageId) ?? null;

export const listPageConfigsByEndpoint = (endpoint: UiEndpoint): PageConfig[] =>
  listPageConfigs().filter((config) => config.roleScope === endpoint);

export const getPageConfig = (pageId: string): PageConfig | null =>
  listPageConfigs().find((config) => config.id === pageId) ?? null;

export const hasStoredPageConfig = (pageId: string): boolean =>
  getStoredPageConfigs().some((config) => config.id === pageId);

export const getDefaultPageConfig = (pageId: string): PageConfig | null =>
  getDefaultPageConfigs().find((config) => config.id === pageId) ?? null;

export const savePageConfig = (config: PageConfig): PageConfig => {
  const parsedConfig = PageConfigSchema.parse(normalizePageConfig(config));
  const storedConfigs = getStoredPageConfigs();
  const nextStoredConfigs = [
    ...storedConfigs.filter((candidate) => candidate.id !== parsedConfig.id),
    parsedConfig,
  ];

  try {
    persistStoredPageConfigs(nextStoredConfigs);
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "QuotaExceededError") {
      throw error;
    }

    throw new Error("本地存储空间不足，无法保存页面配置。请先清理浏览器站点数据后重试。");
  }

  notifyPageConfigListeners();
  return parsedConfig;
};
