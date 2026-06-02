import { z } from "zod";

export const LevelCommentSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  userId: z.string().min(1),
  content: z.string().min(1).max(500),
  createdAt: z.string(),
});

export type LevelComment = z.infer<typeof LevelCommentSchema>;
