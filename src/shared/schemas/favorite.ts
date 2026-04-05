import { z } from "zod";
import { IdSchema, IsoDateTimeSchema } from "./common.js";
import { LevelSchema } from "./level.js";

export const FavoriteSchema = z.object({
  id: IdSchema,
  levelId: IdSchema,
  userId: IdSchema,
  createdAt: IsoDateTimeSchema,
});

export const FavoriteWithLevelSchema = FavoriteSchema.extend({
  level: LevelSchema,
});

export type Favorite = z.infer<typeof FavoriteSchema>;
export type FavoriteWithLevel = z.infer<typeof FavoriteWithLevelSchema>;
