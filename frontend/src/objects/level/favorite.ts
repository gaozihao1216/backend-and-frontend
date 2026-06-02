import { z } from "zod";
import { LevelSchema } from "./level.js";

export const FavoriteSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  userId: z.string().min(1),
  createdAt: z.string(),
});

export type Favorite = z.infer<typeof FavoriteSchema>;

export const FavoriteWithLevelSchema = FavoriteSchema.extend({
  level: LevelSchema,
});

export type FavoriteWithLevel = z.infer<typeof FavoriteWithLevelSchema>;
