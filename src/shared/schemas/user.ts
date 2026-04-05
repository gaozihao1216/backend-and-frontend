import { z } from "zod";
import { IdSchema, IsoDateTimeSchema, UserRoleSchema } from "./common.js";
import { CommentSchema } from "./comment.js";
import { LevelSchema } from "./level.js";

export const BaseUserSchema = z.object({
  id: IdSchema,
  username: z.string().min(3).max(32),
  displayName: z.string().min(1).max(50),
  role: UserRoleSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const PlayerSchema = BaseUserSchema.extend({
  role: z.literal("player"),
});

export const DesignerSchema = BaseUserSchema.extend({
  role: z.literal("designer"),
});

export const AdminSchema = BaseUserSchema.extend({
  role: z.literal("admin"),
});

export const UserSchema = z.discriminatedUnion("role", [
  PlayerSchema,
  DesignerSchema,
  AdminSchema,
]);

export const UserIdParamsSchema = z.object({
  userId: IdSchema,
});

export const UserProfileStatsSchema = z.object({
  favoriteCount: z.number().int().nonnegative(),
  ratingCount: z.number().int().nonnegative(),
});

export const UserProfileSchema = z.object({
  user: UserSchema,
  publishedLevels: z.array(LevelSchema),
  recentComments: z.array(CommentSchema),
  stats: UserProfileStatsSchema,
});

export const BindBackendUserInputSchema = z.object({
  localUserId: z.string().trim().min(1).max(64),
  nickname: z.string().trim().min(2).max(20),
  role: UserRoleSchema,
});

export type BaseUser = z.infer<typeof BaseUserSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type Designer = z.infer<typeof DesignerSchema>;
export type Admin = z.infer<typeof AdminSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserIdParams = z.infer<typeof UserIdParamsSchema>;
export type UserProfileStats = z.infer<typeof UserProfileStatsSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type BindBackendUserInput = z.infer<typeof BindBackendUserInputSchema>;
