import { z } from "zod";
import { nullishToUndefined } from "../system/schema-utils.js";
import { PositionSchema } from "./position.js";
import { SizeSchema } from "./size.js";

export const LevelObstacleSchema = z.object({
  id: z.string().min(1),
  material: z.enum(["wood", "stone", "glass"]),
  position: PositionSchema,
  size: SizeSchema,
  angle: nullishToUndefined(z.number()),
});

export type LevelObstacle = z.infer<typeof LevelObstacleSchema>;
