import { z } from "zod";

export const LevelTagSchema = z.enum(["puzzle", "hard", "beginner", "funny", "strategy"]);
export type LevelTag = z.infer<typeof LevelTagSchema>;
