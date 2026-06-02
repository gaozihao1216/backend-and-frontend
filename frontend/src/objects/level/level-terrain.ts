import { z } from "zod";
import { LevelGroundSchema } from "./level-ground.js";

export const TerrainVoidSpanSchema = z.object({
  id: z.string().min(1),
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
