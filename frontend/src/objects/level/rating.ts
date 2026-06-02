import { z } from "zod";

export const RatingSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  playerId: z.string().min(1),
  score: z.number().int().min(1).max(5),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Rating = z.infer<typeof RatingSchema>;
