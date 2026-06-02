import { z } from "zod";

export type LevelTag = "puzzle" | "hard" | "beginner" | "funny" | "strategy";

export type Position = {
  x: number;
  y: number;
};

export type LevelGround =
  | {
      type: "line";
      points: Position[];
    }
  | {
      type: "bezier";
      controlPoints: Position[];
    };

export type TerrainVoidSpan = {
  id: string;
  startX: number;
  endX: number;
};

export type LevelTerrain = {
  ceilingBoundary?: LevelGround | undefined;
  groundBoundary: LevelGround;
  voidSpans: TerrainVoidSpan[];
};

export type LevelObstacle = {
  id: string;
  material: "wood" | "stone" | "glass";
  position: Position;
  size: {
    width: number;
    height: number;
  };
  angle?: number | undefined;
};

export type LevelEnemy = {
  id: string;
  type: "pig";
  position: Position;
  size?: {
    width: number;
    height: number;
  } | undefined;
};

export type LevelData = {
  world: {
    width: number;
    height: number;
    gravity: number;
  };
  ground?: LevelGround | undefined;
  terrain?: LevelTerrain | undefined;
  birdInventory: {
    basic: number;
  };
  obstacles: LevelObstacle[];
  enemies: LevelEnemy[];
};

export type LevelStatus = "draft" | "pending_review" | "published" | "rejected";
export type PublishedLevelsSort = "newest" | "highestRated" | "mostRated";

export type Level = {
  id: string;
  title: string;
  description: string;
  tags: LevelTag[];
  data: LevelData;
  authorId: string;
  status: LevelStatus;
  rejectionReason?: string | undefined;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | undefined;
};

export const LevelTagSchema = z.enum(["puzzle", "hard", "beginner", "funny", "strategy"]);

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const LevelGroundSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("line"),
    points: z.array(PositionSchema).min(2),
  }),
  z.object({
    type: z.literal("bezier"),
    controlPoints: z.array(PositionSchema).min(3),
  }),
]);

export const TerrainVoidSpanSchema = z.object({
  id: z.string().min(1),
  startX: z.number(),
  endX: z.number(),
});

export const LevelTerrainSchema = z.object({
  ceilingBoundary: LevelGroundSchema.optional(),
  groundBoundary: LevelGroundSchema,
  voidSpans: z.array(TerrainVoidSpanSchema),
});

export const LevelObstacleSchema = z.object({
  id: z.string().min(1),
  material: z.enum(["wood", "stone", "glass"]),
  position: PositionSchema,
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  angle: z.number().optional(),
});

export const LevelEnemySchema = z.object({
  id: z.string().min(1),
  type: z.literal("pig"),
  position: PositionSchema,
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
});

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

export const CreateLevelInputSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).default(""),
  tags: z.array(LevelTagSchema).max(5).default([]),
  data: LevelDataSchema,
});
export type CreateLevelInput = z.infer<typeof CreateLevelInputSchema>;

export const LevelSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().max(1000),
  tags: z.array(LevelTagSchema).max(5),
  data: LevelDataSchema,
  authorId: z.string().min(1),
  status: z.enum(["draft", "pending_review", "published", "rejected"]),
  rejectionReason: z.string().max(1000).optional(),
  averageRating: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
});

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
