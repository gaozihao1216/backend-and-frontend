import { LEVEL_NODE_DEFINITIONS } from "../../../../objects/ui-customization/level-map-structure.js";

/**
 * 关卡节点进度状态计算。
 *
 * 后端只需要告诉前端哪些关卡已通关；这里按 LEVEL_NODE_SUFFIX_ORDER 推导锁定、
 * 已解锁未通关、已通关三种 UI 状态。
 */
export const LEVEL_NODE_PROGRESS_API_KEY = "player.levelProgress";

export const LEVEL_NODE_PROGRESS_STATE_IDS = ["locked", "notCleared", "cleared"] as const;

export type LevelNodeProgressStateId = typeof LEVEL_NODE_PROGRESS_STATE_IDS[number];

export const LEVEL_NODE_SUFFIX_ORDER = LEVEL_NODE_DEFINITIONS.map((level) => level.suffix);

export type LevelNodeProgressPayload = {
  levels: Record<string, LevelNodeProgressStateId | string>;
  clearedCount?: number;
};

export const isLevelUnlocked = (clearedLevels: ReadonlySet<string>, levelSuffix: string): boolean => {
  const index = LEVEL_NODE_SUFFIX_ORDER.indexOf(levelSuffix);
  if (index <= 0) {
    return true;
  }

  const previousSuffix = LEVEL_NODE_SUFFIX_ORDER[index - 1];
  return previousSuffix ? clearedLevels.has(previousSuffix) : false;
};

export const resolveLevelNodeProgressState = (
  levelSuffix: string,
  clearedLevels: ReadonlySet<string>,
): LevelNodeProgressStateId => {
  if (clearedLevels.has(levelSuffix)) {
    return "cleared";
  }

  if (isLevelUnlocked(clearedLevels, levelSuffix)) {
    return "notCleared";
  }

  return "locked";
};

/** 根据已通关集合生成动态 UI runtime 可消费的进度 payload。 */
export const buildLevelProgressPayload = (
  clearedLevels: Iterable<string>,
): LevelNodeProgressPayload => {
  const clearedSet = new Set(clearedLevels);
  const levels = Object.fromEntries(
    LEVEL_NODE_SUFFIX_ORDER.map((suffix) => [
      suffix,
      resolveLevelNodeProgressState(suffix, clearedSet),
    ]),
  ) as Record<string, LevelNodeProgressStateId>;

  return {
    levels,
    clearedCount: clearedSet.size,
  };
};

export const readLevelProgressPayload = (
  uiData: Record<string, unknown>,
): LevelNodeProgressPayload | null => {
  const payload = uiData[LEVEL_NODE_PROGRESS_API_KEY];
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const levels = (payload as LevelNodeProgressPayload).levels;
  if (!levels || typeof levels !== "object") {
    return null;
  }

  return payload as LevelNodeProgressPayload;
};

export const resolveLevelNodeStateFromUiData = (
  levelSuffix: string,
  uiData: Record<string, unknown>,
  fallbackState: LevelNodeProgressStateId = "locked",
): LevelNodeProgressStateId => {
  const payload = readLevelProgressPayload(uiData);
  const raw = payload?.levels[levelSuffix];
  if (typeof raw === "string" && LEVEL_NODE_PROGRESS_STATE_IDS.includes(raw as LevelNodeProgressStateId)) {
    return raw as LevelNodeProgressStateId;
  }

  return fallbackState;
};

export const buildPreviewClearedLevels = (
  previewState: LevelNodeProgressStateId,
  previewLevelSuffix: string,
): Set<string> => {
  const previewIndex = LEVEL_NODE_SUFFIX_ORDER.indexOf(previewLevelSuffix);
  const clearedLevels = new Set<string>();

  if (previewIndex < 0) {
    return clearedLevels;
  }

  if (previewState === "cleared") {
    LEVEL_NODE_SUFFIX_ORDER.slice(0, previewIndex + 1).forEach((suffix) => clearedLevels.add(suffix));
    return clearedLevels;
  }

  if (previewState === "notCleared") {
    LEVEL_NODE_SUFFIX_ORDER.slice(0, previewIndex).forEach((suffix) => clearedLevels.add(suffix));
    return clearedLevels;
  }

  LEVEL_NODE_SUFFIX_ORDER.slice(0, Math.max(0, previewIndex - 1)).forEach((suffix) => clearedLevels.add(suffix));
  return clearedLevels;
};

/** director 预览用：构造指定节点处于某个状态时的模拟 uiData。 */
export const createPreviewLevelProgressUiData = (
  previewState: LevelNodeProgressStateId,
  previewLevelSuffix = LEVEL_NODE_SUFFIX_ORDER[0] ?? "level01",
): Record<string, unknown> => ({
  [LEVEL_NODE_PROGRESS_API_KEY]: buildLevelProgressPayload(
    buildPreviewClearedLevels(previewState, previewLevelSuffix),
  ),
});
