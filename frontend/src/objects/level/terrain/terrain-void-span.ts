import { z } from "zod";

export const TerrainVoidSpanSchema = z.object({
  id: z.string().min(1),
  startX: z.number(),
  endX: z.number(),
});

export type TerrainVoidSpan = z.infer<typeof TerrainVoidSpanSchema>;
