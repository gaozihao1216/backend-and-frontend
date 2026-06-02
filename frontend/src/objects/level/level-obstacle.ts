import { z } from "zod";
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
