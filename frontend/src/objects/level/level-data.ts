import { z } from "zod";
import { LevelGroundSchema } from "./level-ground.js";
import { LevelTerrainSchema } from "./level-terrain.js";
import { PositionSchema } from "./position.js";
import { SizeSchema } from "./size.js";

export const LevelObstacleSchema = z.object({
  id: z.string().min(1),
  material: z.enum(["wood", "stone", "glass"]),
  position: PositionSchema,
  size: SizeSchema,
  angle: z.number().optional(),
});

export type LevelObstacle = z.infer<typeof LevelObstacleSchema>;

export const LevelEnemySchema = z.object({
  id: z.string().min(1),
  type: z.literal("pig"),
  position: PositionSchema,
  size: SizeSchema.optional(),
});

export type LevelEnemy = z.infer<typeof LevelEnemySchema>;

export const LevelDataSchema = z.object({
  world: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    gravity: z.number().positive(),
  }),
  ground: LevelGroundSchema.optional(),
  terrain: LevelTerrainSchema.optional(),
  birdInventory: z.object({
    basic: z.number().int().nonnegative(),
  }),
  obstacles: z.array(LevelObstacleSchema),
  enemies: z.array(LevelEnemySchema),
});

export type LevelData = z.infer<typeof LevelDataSchema>;
