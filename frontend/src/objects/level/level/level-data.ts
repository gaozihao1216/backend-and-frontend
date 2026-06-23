import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { BirdInventorySchema } from "../inventory/bird-inventory.js";
import { BirdPoolSchema } from "../inventory/bird-pool.js";
import { GameWorldSchema } from "./game-world.js";
import { LevelGroundSchema } from "../terrain/level-ground.js";
import { LevelTerrainSchema } from "../terrain/level-terrain.js";
import { LevelEnemySchema } from "../terrain/level-enemy.js";
import { LevelObstacleSchema } from "../terrain/level-obstacle.js";

export const LevelDataSchema = z.object({
  world: GameWorldSchema,
  ground: nullishToUndefined(LevelGroundSchema),
  terrain: nullishToUndefined(LevelTerrainSchema),
  birdInventory: BirdInventorySchema,
  birdPool: nullishToUndefined(BirdPoolSchema),
  obstacles: z.array(LevelObstacleSchema),
  enemies: z.array(LevelEnemySchema),
  backgroundTemplateId: nullishToUndefined(z.string().min(1)),
});

export type LevelData = z.infer<typeof LevelDataSchema>;
export { BirdInventorySchema } from "../inventory/bird-inventory.js";
export type { BirdInventory } from "../inventory/bird-inventory.js";
export { GameWorldSchema } from "./game-world.js";
export { LevelEnemySchema } from "../terrain/level-enemy.js";
export { LevelObstacleSchema } from "../terrain/level-obstacle.js";
export { BirdPoolSchema } from "../inventory/bird-pool.js";
export type { BirdPool } from "../inventory/bird-pool.js";
export type { GameWorld } from "./game-world.js";
export type { LevelEnemy } from "../terrain/level-enemy.js";
export type { LevelObstacle } from "../terrain/level-obstacle.js";
