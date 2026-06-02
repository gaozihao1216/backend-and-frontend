import { z } from "zod";

export const LevelStatusSchema = z.enum(["draft", "pending_review", "published", "rejected"]);
export type LevelStatus = z.infer<typeof LevelStatusSchema>;
