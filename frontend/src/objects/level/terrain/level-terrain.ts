import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { LevelGroundSchema } from "./level-ground.js";
import { TerrainVoidSpanSchema } from "./terrain-void-span.js";

export const LevelTerrainSchema = z.object({
  ceilingBoundary: nullishToUndefined(LevelGroundSchema),
  groundBoundary: LevelGroundSchema,
  voidSpans: z.array(TerrainVoidSpanSchema),
});

export type LevelTerrain = z.infer<typeof LevelTerrainSchema>;
export { TerrainVoidSpanSchema } from "./terrain-void-span.js";
export type { TerrainVoidSpan } from "./terrain-void-span.js";
