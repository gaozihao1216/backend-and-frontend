import { z } from "zod";
import { LevelTagSchema, type LevelTag, type PublishedLevelsSort } from "../objects/system/system-objects.js";
import { type Position, PositionSchema } from "../objects/level/position.js";
import { type LevelGround, LevelGroundSchema } from "../objects/level/level-ground.js";
import { type LevelTerrain, type TerrainVoidSpan, LevelTerrainSchema, TerrainVoidSpanSchema } from "../objects/level/level-terrain.js";
import { type LevelData, type LevelEnemy, type LevelObstacle, LevelDataSchema, LevelEnemySchema, LevelObstacleSchema } from "../objects/level/level-data.js";
import { type Level, LevelSchema } from "../objects/level/level.js";

export { LevelTagSchema } from "../objects/system/system-objects.js";
export type { LevelTag, PublishedLevelsSort } from "../objects/system/system-objects.js";
export { PositionSchema } from "../objects/level/position.js";
export type { Position } from "../objects/level/position.js";
export { LevelGroundSchema } from "../objects/level/level-ground.js";
export type { LevelGround } from "../objects/level/level-ground.js";
export { LevelTerrainSchema, TerrainVoidSpanSchema } from "../objects/level/level-terrain.js";
export type { LevelTerrain, TerrainVoidSpan } from "../objects/level/level-terrain.js";
export { LevelDataSchema, LevelEnemySchema, LevelObstacleSchema } from "../objects/level/level-data.js";
export type { LevelData, LevelEnemy, LevelObstacle } from "../objects/level/level-data.js";
export { LevelSchema } from "../objects/level/level.js";
export type { Level } from "../objects/level/level.js";

export const CreateLevelInputSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).default(""),
  tags: z.array(LevelTagSchema).max(5).default([]),
  data: LevelDataSchema,
});
export type CreateLevelInput = z.infer<typeof CreateLevelInputSchema>;

export const STARTER_LEVEL_ID = "level-1";
export const STARTER_LEVEL_TITLE = "Starter Level";
export const STARTER_LEVEL_DESCRIPTION = "预置示例关卡";
export const STARTER_LEVEL_TAGS: LevelTag[] = ["beginner", "puzzle"];
export const STARTER_LEVEL_DATA: LevelData = {
  world: {
    width: 1200,
    height: 800,
    gravity: 9.8,
  },
  ground: {
    type: "line",
    points: [
      { x: 0, y: 752 },
      { x: 600, y: 752 },
      { x: 1200, y: 752 },
    ],
  },
  birdInventory: {
    basic: 3,
  },
  obstacles: [
    {
      id: "obstacle-glass-panel",
      material: "glass",
      position: { x: 700, y: 640 },
      size: { width: 20, height: 140 },
    },
    {
      id: "obstacle-wood-panel",
      material: "wood",
      position: { x: 860, y: 630 },
      size: { width: 44, height: 150 },
    },
    {
      id: "obstacle-stone-block",
      material: "stone",
      position: { x: 1040, y: 640 },
      size: { width: 96, height: 96 },
    },
    {
      id: "obstacle-wood-ledge",
      material: "wood",
      position: { x: 900, y: 540 },
      size: { width: 180, height: 24 },
    },
    {
      id: "obstacle-glass-top",
      material: "glass",
      position: { x: 700, y: 518 },
      size: { width: 72, height: 20 },
    },
  ],
  enemies: [
    {
      id: "enemy-1",
      type: "pig",
      position: { x: 900, y: 470 },
    },
    {
      id: "enemy-2",
      type: "pig",
      position: { x: 1040, y: 565 },
    },
  ],
};

export const BUILTIN_LEVEL_DEFINITIONS = {
  [STARTER_LEVEL_ID]: {
    id: STARTER_LEVEL_ID,
    title: STARTER_LEVEL_TITLE,
    description: STARTER_LEVEL_DESCRIPTION,
    tags: STARTER_LEVEL_TAGS,
    data: STARTER_LEVEL_DATA,
  },
} as const;
