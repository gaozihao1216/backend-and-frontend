import { z } from "zod";
import { BackendUserSchema } from "../auth/backend-user.js";
import { LevelSchema } from "../level/level.js";
import { LevelCommentSchema } from "../level/level-comment.js";

export const UserProfileStatsSchema = z.object({
  favoriteCount: z.number().int().nonnegative(),
  ratingCount: z.number().int().nonnegative(),
});

export type UserProfileStats = z.infer<typeof UserProfileStatsSchema>;

export const UserProfileSchema = z.object({
  user: BackendUserSchema,
  publishedLevels: z.array(LevelSchema),
  recentComments: z.array(LevelCommentSchema),
  stats: UserProfileStatsSchema,
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
