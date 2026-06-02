import { z } from "zod";
import {
  CreateLevelInputSchema,
  LevelDataSchema,
  LevelSchema,
  LevelTagSchema,
  type Level as LevelContract,
  type LevelData,
  type LevelTag,
  type LevelEnemy,
  type LevelObstacle,
  type LevelGround,
  type LevelTerrain,
  type Position,
  type TerrainVoidSpan,
  type PublishedLevelsSort,
  type CreateLevelInput,
} from "../level-contracts.js";

export const UserRoleSchema = z.enum(["player", "designer", "admin"]);

export const UserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(3).max(32),
  displayName: z.string().min(1).max(50),
  role: UserRoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const UserProfileStatsSchema = z.object({
  favoriteCount: z.number().int().nonnegative(),
  ratingCount: z.number().int().nonnegative(),
});

export const CommentSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  userId: z.string().min(1),
  content: z.string().min(1).max(500),
  createdAt: z.string(),
});
export type Comment = z.infer<typeof CommentSchema>;

export const FavoriteSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  userId: z.string().min(1),
  createdAt: z.string(),
});
export type Favorite = z.infer<typeof FavoriteSchema>;

export const FavoriteWithLevelSchema = FavoriteSchema.extend({
  level: LevelSchema,
});

export const RatingSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  playerId: z.string().min(1),
  score: z.number().int().min(1).max(5),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Rating = z.infer<typeof RatingSchema>;

export const SubmissionSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  submitterId: z.string().min(1),
  status: z.enum(["pending_review", "approved", "rejected"]),
  reviewerId: z.string().min(1).optional(),
  reviewNote: z.string().max(1000).optional(),
  submittedAt: z.string(),
  reviewedAt: z.string().optional(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

export const SubmissionWithLevelSchema = SubmissionSchema.extend({
  level: LevelSchema,
});

export const UserProfileSchema = z.object({
  user: UserSchema,
  publishedLevels: z.array(LevelSchema),
  recentComments: z.array(CommentSchema),
  stats: UserProfileStatsSchema,
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export type BoundBackendUser = User;
export type Level = LevelContract;
export type PublishedLevel = LevelContract;
export type LevelComment = Comment;
export type LevelRating = Rating;
export type RatingValue = 1 | 2 | 3 | 4 | 5;
export type PlayerFavorite = Favorite;
export type PlayerFavoriteWithLevel = z.infer<typeof FavoriteWithLevelSchema>;
export type FavoriteWithLevel = PlayerFavoriteWithLevel;
export type DesignerLevel = LevelContract;
export type DesignerSubmission = Submission;
export type PendingSubmission = z.infer<typeof SubmissionWithLevelSchema>;
export type SubmissionWithLevel = PendingSubmission;
export type ReviewedSubmission = Submission;
export type AdminComment = Comment;
export type ApiUserProfile = UserProfile;

export const GetBackendUsersRequestQuerySchema = z.object({});
export type GetBackendUsersRequestQuery = z.infer<typeof GetBackendUsersRequestQuerySchema>;
export const GetBackendUsersResponseDataSchema = z.array(UserSchema);

export const BindBackendUserRequestBodySchema = z.object({
  localUserId: z.string().trim().min(1).max(64),
  nickname: z.string().trim().min(2).max(20),
  role: UserRoleSchema,
});
export type BindBackendUserRequestBody = z.infer<typeof BindBackendUserRequestBodySchema>;
export const BindBackendUserResponseDataSchema = UserSchema;

export const GetUserProfileRequestQuerySchema = z.object({});
export const GetUserProfileRequestParamsSchema = z.object({
  userId: z.string().min(1),
});
export const GetUserProfileResponseDataSchema = UserProfileSchema;

export const CreateLevelRequestBodySchema = CreateLevelInputSchema;
export type CreateLevelRequestBody = CreateLevelInput;
export const CreateLevelResponseDataSchema = LevelSchema;

export const SubmitLevelRequestBodySchema = z.object({
  levelId: z.string().min(1),
});
export const SubmitLevelResponseDataSchema = SubmissionSchema;

export const GetPublishedLevelsRequestQuerySchema = z.object({
  tag: LevelTagSchema.optional(),
  sort: z.enum(["newest", "highestRated", "mostRated"]).default("newest"),
});
export type GetPublishedLevelsRequestQuery = z.infer<typeof GetPublishedLevelsRequestQuerySchema>;
export const GetPublishedLevelsResponseDataSchema = z.array(LevelSchema);

export const GetPublishedLevelRequestParamsSchema = z.object({
  levelId: z.string().min(1),
});
export const GetPublishedLevelResponseDataSchema = LevelSchema;

export const GetFavoriteLevelsRequestQuerySchema = z.object({});
export const GetFavoriteLevelsResponseDataSchema = z.array(FavoriteWithLevelSchema);

export const FavoriteLevelRequestParamsSchema = z.object({
  levelId: z.string().min(1),
});
export const FavoriteLevelResponseDataSchema = FavoriteSchema;
export const UnfavoriteLevelRequestParamsSchema = FavoriteLevelRequestParamsSchema;
export const UnfavoriteLevelResponseDataSchema = FavoriteSchema;

export const RateLevelRequestParamsSchema = z.object({
  levelId: z.string().min(1),
});
export const RateLevelRequestBodySchema = z.object({
  score: z.number().int().min(1).max(5),
});
export type RateLevelRequestBody = z.infer<typeof RateLevelRequestBodySchema>;
export const RateLevelResponseDataSchema = RatingSchema;

export const GetLevelCommentsRequestParamsSchema = z.object({
  levelId: z.string().min(1),
});
export const GetLevelCommentsResponseDataSchema = z.array(CommentSchema);

export const CreateCommentRequestParamsSchema = GetLevelCommentsRequestParamsSchema;
export const CreateCommentRequestBodySchema = z.object({
  content: z.string().trim().min(1).max(500),
});
export type CreateCommentRequestBody = z.infer<typeof CreateCommentRequestBodySchema>;
export const CreateCommentResponseDataSchema = CommentSchema;

export const GetAdminCommentsRequestQuerySchema = z.object({});
export const GetAdminCommentsResponseDataSchema = z.array(CommentSchema);
export const DeleteCommentRequestParamsSchema = z.object({
  commentId: z.string().min(1),
});
export const DeleteCommentResponseDataSchema = CommentSchema;

export const GetPendingSubmissionsRequestQuerySchema = z.object({});
export const GetPendingSubmissionsResponseDataSchema = z.array(SubmissionWithLevelSchema);
export const ReviewSubmissionRequestParamsSchema = z.object({
  submissionId: z.string().min(1),
});
export const ReviewSubmissionRequestBodySchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(1000).optional(),
});
export type ReviewSubmissionRequestBody = z.infer<typeof ReviewSubmissionRequestBodySchema>;
export const ReviewSubmissionResponseDataSchema = SubmissionSchema;

