import { z } from "zod";

export const UserProfileStatsSchema = z.object({
  favoriteCount: z.number().int().nonnegative(),
  ratingCount: z.number().int().nonnegative(),
});

export type UserProfileStats = z.infer<typeof UserProfileStatsSchema>;
