import { z } from "zod";
import { nullishToUndefined } from "../system/schema-utils.js";
import { BirdInventorySchema } from "./bird-inventory.js";
import { BirdPoolSchema } from "./bird-pool.js";
import { GameWorldSchema } from "./game-world.js";
import { LevelGroundSchema } from "./level-ground.js";
import { LevelTerrainSchema } from "./level-terrain.js";
import { LevelEnemySchema } from "./level-enemy.js";
import { LevelObstacleSchema } from "./level-obstacle.js";

export const LevelDataSchema = z.object({
  world: GameWorldSchema,
  ground: nullishToUndefined(LevelGroundSchema),
  terrain: nullishToUndefined(LevelTerrainSchema),
  birdInventory: BirdInventorySchema,
  birdPool: BirdPoolSchema.optional(),
  obstacles: z.array(LevelObstacleSchema),
  enemies: z.array(LevelEnemySchema),
  backgroundTemplateId: nullishToUndefined(z.string().min(1)),
});

export type LevelData = z.infer<typeof LevelDataSchema>;
export { BirdInventorySchema } from "./bird-inventory.js";
export type { BirdInventory } from "./bird-inventory.js";
export { GameWorldSchema } from "./game-world.js";
export { LevelEnemySchema } from "./level-enemy.js";
export { LevelObstacleSchema } from "./level-obstacle.js";
export { BirdPoolSchema } from "./bird-pool.js";
export type { BirdPool } from "./bird-pool.js";
export type { GameWorld } from "./game-world.js";
export type { LevelEnemy } from "./level-enemy.js";
export type { LevelObstacle } from "./level-obstacle.js";
