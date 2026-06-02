import { z } from "zod";
import { BackendUserSchema } from "../auth/backend-user.js";
import { LevelSchema } from "../level/level.js";
import { LevelCommentSchema } from "../level/level-comment.js";
import { UserProfileStatsSchema } from "./user-profile-stats.js";

export const UserProfileSchema = z.object({
  user: BackendUserSchema,
  publishedLevels: z.array(LevelSchema),
  recentComments: z.array(LevelCommentSchema),
  stats: UserProfileStatsSchema,
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type { UserProfileStats } from "./user-profile-stats.js";
