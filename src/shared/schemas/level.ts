import { z } from "zod";
import { IdSchema, IsoDateTimeSchema, LevelStatusSchema } from "./common.js";

export const LevelTagSchema = z.enum([
  "puzzle",
  "hard",
  "beginner",
  "funny",
  "strategy",
]);

export const LevelTagsSchema = z.array(LevelTagSchema).max(5);

export const PublishedLevelsSortSchema = z.enum([
  "newest",
  "highestRated",
  "mostRated",
]);

export const PublishedLevelsQuerySchema = z.object({
  tag: LevelTagSchema.optional(),
  sort: PublishedLevelsSortSchema.default("newest"),
});

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const SizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export const LevelObstacleSchema = z.object({
  id: IdSchema,
  material: z.enum(["wood", "stone", "glass"]),
  position: PositionSchema,
  size: SizeSchema,
});

export const LevelEnemySchema = z.object({
  id: IdSchema,
  type: z.enum(["pig"]),
  position: PositionSchema,
});

export const LevelDataSchema = z.object({
  world: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    gravity: z.number().positive(),
  }),
  birdInventory: z.object({
    basic: z.number().int().nonnegative(),
  }),
  obstacles: z.array(LevelObstacleSchema),
  enemies: z.array(LevelEnemySchema),
});

export const LevelSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(100),
  description: z.string().max(1000),
  tags: LevelTagsSchema,
  data: LevelDataSchema,
  authorId: IdSchema,
  status: LevelStatusSchema,
  rejectionReason: z.string().max(1000).optional(),
  averageRating: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  publishedAt: IsoDateTimeSchema.optional(),
});

export const CreateLevelInputSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).default(""),
  tags: LevelTagsSchema.default([]),
  data: LevelDataSchema,
});

export const SubmitLevelInputSchema = z.object({
  levelId: IdSchema,
});

export const LevelIdParamsSchema = z.object({
  levelId: IdSchema,
});

export type Position = z.infer<typeof PositionSchema>;
export type Size = z.infer<typeof SizeSchema>;
export type LevelTag = z.infer<typeof LevelTagSchema>;
export type PublishedLevelsSort = z.infer<typeof PublishedLevelsSortSchema>;
export type LevelObstacle = z.infer<typeof LevelObstacleSchema>;
export type LevelEnemy = z.infer<typeof LevelEnemySchema>;
export type LevelData = z.infer<typeof LevelDataSchema>;
export type Level = z.infer<typeof LevelSchema>;
export type CreateLevelInput = z.infer<typeof CreateLevelInputSchema>;
export type SubmitLevelInput = z.infer<typeof SubmitLevelInputSchema>;
export type LevelIdParams = z.infer<typeof LevelIdParamsSchema>;
export type PublishedLevelsQuery = z.infer<typeof PublishedLevelsQuerySchema>;
