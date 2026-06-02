import { z } from "zod";

export const UserRoleSchema = z.enum(["player", "designer", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const LevelStatusSchema = z.enum(["draft", "pending_review", "published", "rejected"]);
export type LevelStatus = z.infer<typeof LevelStatusSchema>;

export const SubmissionStatusSchema = z.enum(["pending_review", "approved", "rejected"]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

export const LevelTagSchema = z.enum(["puzzle", "hard", "beginner", "funny", "strategy"]);
export type LevelTag = z.infer<typeof LevelTagSchema>;

export type PublishedLevelsSort = "newest" | "highestRated" | "mostRated";
