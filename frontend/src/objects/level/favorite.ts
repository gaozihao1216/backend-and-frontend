import { z } from "zod";

export const FavoriteSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  userId: z.string().min(1),
  createdAt: z.string(),
});

export type Favorite = z.infer<typeof FavoriteSchema>;
export { FavoriteWithLevelSchema } from "./favorite-with-level.js";
export type { FavoriteWithLevel } from "./favorite-with-level.js";
