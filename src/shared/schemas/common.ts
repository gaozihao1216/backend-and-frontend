import { z } from "zod";

// common.ts 放跨领域都会复用的基础 schema，避免每个模块重复定义。
export const IdSchema = z.string().min(1);
export const IsoDateTimeSchema = z.string().datetime({ offset: true });

export const UserRoleSchema = z.enum(["player", "designer", "admin"]);

export const LevelStatusSchema = z.enum([
  "draft",
  "pending_review",
  "published",
  "rejected",
]);

export const SubmissionStatusSchema = z.enum([
  "pending_review",
  "approved",
  "rejected",
]);

export type Id = z.infer<typeof IdSchema>;
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type LevelStatus = z.infer<typeof LevelStatusSchema>;
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;
