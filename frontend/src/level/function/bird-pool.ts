import type { BirdInventory } from "../../objects/level/inventory/bird-inventory.js";
import { DEFAULT_BIRD_POOL, type BirdPool } from "../../objects/level/inventory/bird-pool.js";

/**
 * 关卡鸟池配置归一化。
 *
 * 旧关卡可能只有 birdInventory，新关卡使用 birdPool；
 * 游戏会话创建前统一经过这里，保证发射池始终有完整配置。
 */
type BirdPoolSource = {
  birdInventory: BirdInventory;
  birdPool?: BirdPool | undefined;
};

export const normalizeBirdPool = (source: BirdPoolSource): BirdPool => {
  if (source.birdPool) {
    return source.birdPool;
  }

  const entries = Object.entries(source.birdInventory).filter(([, count]) => count > 0);
  if (entries.length === 0) {
    return DEFAULT_BIRD_POOL;
  }

  if (entries.length === 1 && entries[0]![0] === "basic") {
    return {
      totalBirds: entries[0]![1],
      allowedBirdTypes: [],
      caps: {},
    };
  }

  return {
    totalBirds: entries.reduce((sum, [, count]) => sum + count, 0),
    allowedBirdTypes: entries.map(([birdType]) => birdType),
    caps: Object.fromEntries(entries),
  };
};

/** 将新 birdPool 写回旧 birdInventory 字段，兼容仍读取旧字段的页面。 */
export const syncLegacyBirdInventory = (pool: BirdPool): BirdInventory => ({
  basic: pool.totalBirds,
});
