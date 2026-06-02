import { z } from "zod";

const IdSchema = z.string().min(1);
const IsoDateTimeSchema = z.string().datetime({ offset: true });

export const UserRoleSchema = z.enum(["player", "designer", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const BaseUserSchema = z.object({
  id: IdSchema,
  username: z.string().min(3).max(32),
  displayName: z.string().min(1).max(50),
  role: UserRoleSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const PlayerSchema = BaseUserSchema.extend({
  role: z.literal("player"),
});

export const DesignerSchema = BaseUserSchema.extend({
  role: z.literal("designer"),
});

export const AdminSchema = BaseUserSchema.extend({
  role: z.literal("admin"),
});

export const UserSchema = z.discriminatedUnion("role", [PlayerSchema, DesignerSchema, AdminSchema]);
export type User = z.infer<typeof UserSchema>;

export const UserIdParamsSchema = z.object({
  userId: IdSchema,
});

export const UserProfileStatsSchema = z.object({
  favoriteCount: z.number().int().nonnegative(),
  ratingCount: z.number().int().nonnegative(),
});

export const UserProfileSchema = z.object({
  user: UserSchema,
  publishedLevels: z.array(z.any()),
  recentComments: z.array(z.any()),
  stats: UserProfileStatsSchema,
});

export const BindBackendUserInputSchema = z.object({
  localUserId: z.string().trim().min(1).max(64),
  nickname: z.string().trim().min(2).max(20),
  role: UserRoleSchema,
});
export type BindBackendUserInput = z.infer<typeof BindBackendUserInputSchema>;

export const LevelStatusSchema = z.enum([
  "draft",
  "pending_review",
  "published",
  "rejected",
]);
export type LevelStatus = z.infer<typeof LevelStatusSchema>;

export const SubmissionStatusSchema = z.enum([
  "pending_review",
  "approved",
  "rejected",
]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

export const LevelTagSchema = z.enum([
  "puzzle",
  "hard",
  "beginner",
  "funny",
  "strategy",
]);
export type LevelTag = z.infer<typeof LevelTagSchema>;

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Position = z.infer<typeof PositionSchema>;

export const GroundLineSchema = z.object({
  type: z.literal("line"),
  points: z.array(PositionSchema).min(2),
});

export const GroundBezierSchema = z.object({
  type: z.literal("bezier"),
  controlPoints: z.array(PositionSchema).min(3),
});

export const LevelGroundSchema = z.discriminatedUnion("type", [GroundLineSchema, GroundBezierSchema]);
export type LevelGround = z.infer<typeof LevelGroundSchema>;

export const TerrainVoidSpanSchema = z.object({
  id: IdSchema,
  startX: z.number(),
  endX: z.number(),
});
export type TerrainVoidSpan = z.infer<typeof TerrainVoidSpanSchema>;

export const LevelTerrainSchema = z.object({
  ceilingBoundary: LevelGroundSchema.optional(),
  groundBoundary: LevelGroundSchema,
  voidSpans: z.array(TerrainVoidSpanSchema),
});
export type LevelTerrain = z.infer<typeof LevelTerrainSchema>;

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
export type LevelObstacle = z.infer<typeof LevelObstacleSchema>;

export const LevelEnemySchema = z.object({
  id: IdSchema,
  type: z.enum(["pig"]),
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

export const LevelSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(100),
  description: z.string().max(1000),
  tags: z.array(LevelTagSchema).max(5),
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
export type Level = z.infer<typeof LevelSchema>;

export const CreateLevelInputSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).default(""),
  tags: z.array(LevelTagSchema).max(5).default([]),
  data: LevelDataSchema,
});
export type CreateLevelInput = z.infer<typeof CreateLevelInputSchema>;

export const SubmitLevelInputSchema = z.object({
  levelId: IdSchema,
});
export type SubmitLevelInput = z.infer<typeof SubmitLevelInputSchema>;

export const SubmissionSchema = z.object({
  id: IdSchema,
  levelId: IdSchema,
  submitterId: IdSchema,
  status: SubmissionStatusSchema,
  reviewerId: IdSchema.optional(),
  reviewNote: z.string().max(1000).optional(),
  submittedAt: IsoDateTimeSchema,
  reviewedAt: IsoDateTimeSchema.optional(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

export const ReviewSubmissionInputSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(1000).optional(),
});
export type ReviewSubmissionInput = z.infer<typeof ReviewSubmissionInputSchema>;

export const RatingValueSchema = z.number().int().min(1).max(5);
export const RatingSchema = z.object({
  id: IdSchema,
  levelId: IdSchema,
  playerId: IdSchema,
  score: RatingValueSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type Rating = z.infer<typeof RatingSchema>;

export const CreateRatingInputSchema = z.object({
  score: RatingValueSchema,
});
export type CreateRatingInput = z.infer<typeof CreateRatingInputSchema>;

export const CommentSchema = z.object({
  id: IdSchema,
  levelId: IdSchema,
  userId: IdSchema,
  content: z.string().min(1).max(500),
  createdAt: IsoDateTimeSchema,
});
export type Comment = z.infer<typeof CommentSchema>;

export const CreateCommentInputSchema = z.object({
  content: z.string().trim().min(1).max(500),
});
export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>;

export const CommentIdParamsSchema = z.object({
  commentId: IdSchema,
});

export const FavoriteSchema = z.object({
  id: IdSchema,
  levelId: IdSchema,
  userId: IdSchema,
  createdAt: IsoDateTimeSchema,
});
export type Favorite = z.infer<typeof FavoriteSchema>;

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
