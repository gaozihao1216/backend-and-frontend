import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { PositionSchema } from "./position.js";
import { SizeSchema } from "./size.js";

export const LevelEnemySchema = z.object({
  id: z.string().min(1),
  type: z.literal("pig"),
  position: PositionSchema,
  size: nullishToUndefined(SizeSchema),
});

export type LevelEnemy = z.infer<typeof LevelEnemySchema>;
