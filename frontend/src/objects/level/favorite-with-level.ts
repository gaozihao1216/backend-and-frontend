import { z } from "zod";
import { FavoriteSchema } from "./favorite.js";
import { LevelSchema } from "./level.js";

export const FavoriteWithLevelSchema = FavoriteSchema.extend({
  level: LevelSchema,
});

export type FavoriteWithLevel = z.infer<typeof FavoriteWithLevelSchema>;
