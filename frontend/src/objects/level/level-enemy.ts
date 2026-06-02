import { z } from "zod";
import { PositionSchema } from "./position.js";
import { SizeSchema } from "./size.js";

export const LevelEnemySchema = z.object({
  id: z.string().min(1),
  type: z.literal("pig"),
  position: PositionSchema,
  size: SizeSchema.optional(),
});

export type LevelEnemy = z.infer<typeof LevelEnemySchema>;
