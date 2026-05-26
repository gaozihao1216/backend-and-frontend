import { z } from "zod";
import { IdSchema, IsoDateTimeSchema, LevelStatusSchema } from "./common.js";

// 这些 tag/sort 枚举既服务于前端筛选 UI，也服务于后端查询校验。
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

export const GroundLineSchema = z.object({
  type: z.literal("line"),
  points: z.array(PositionSchema).min(2),
});

export const GroundBezierSchema = z.object({
  type: z.literal("bezier"),
  controlPoints: z.array(PositionSchema).min(3),
});

export const LevelGroundSchema = z.discriminatedUnion("type", [
  GroundLineSchema,
  GroundBezierSchema,
]);

export const TerrainVoidSpanSchema = z.object({
  id: IdSchema,
  startX: z.number(),
  endX: z.number(),
});

export const LevelTerrainSchema = z.object({
  ceilingBoundary: LevelGroundSchema.optional(),
  groundBoundary: LevelGroundSchema,
  voidSpans: z.array(TerrainVoidSpanSchema),
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
  angle: z.number().optional(),
});

export const LevelEnemySchema = z.object({
  id: IdSchema,
  type: z.enum(["pig"]),
  position: PositionSchema,
  size: SizeSchema.optional(),
});

export const LevelDataSchema = z.object({
  world: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    gravity: z.number().positive(),
  }),
  ground: LevelGroundSchema.optional(),
  terrain: LevelTerrainSchema.optional(),
  // 目前只实现了基础小鸟库存，但 schema 结构预留了后续扩展空间。
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

// CreateLevelInput 与完整 Level 分开定义：
// 前者是客户端提交体，后者是服务端补全元数据后的完整记录。
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
export type GroundLine = z.infer<typeof GroundLineSchema>;
export type GroundBezier = z.infer<typeof GroundBezierSchema>;
export type LevelGround = z.infer<typeof LevelGroundSchema>;
export type TerrainVoidSpan = z.infer<typeof TerrainVoidSpanSchema>;
export type LevelTerrain = z.infer<typeof LevelTerrainSchema>;
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
