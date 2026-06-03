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
} from "../lib/level-contracts.js";
import { BackendUserSchema, type BackendUser } from "../objects/auth/backend-user.js";
import { DirectorPermissionSummarySchema, type DirectorPermissionSummary as DirectorPermissionSummaryObject } from "../objects/admin/director-permission-summary.js";
import { ReviewedSubmissionSchema, type ReviewedSubmission as ReviewedSubmissionObject } from "../objects/admin/reviewed-submission.js";
import { FavoriteSchema, type Favorite } from "../objects/level/favorite.js";
import { FavoriteWithLevelSchema, type FavoriteWithLevel as FavoriteWithLevelObject } from "../objects/level/favorite-with-level.js";
import { LevelCommentSchema, type LevelComment as LevelCommentObject } from "../objects/level/level-comment.js";
import { RatingSchema, type Rating } from "../objects/level/rating.js";
import { SubmissionSchema, type Submission as SubmissionObject } from "../objects/level/submission.js";
import { SubmissionWithLevelSchema, type SubmissionWithLevel as SubmissionWithLevelObject } from "../objects/level/submission-with-level.js";
import { UserProfileSchema, type UserProfile as UserProfileObject } from "../objects/user/user-profile.js";
import { UserRoleSchema } from "../objects/system/user-role.js";

export const UserSchema = BackendUserSchema;
export type User = BackendUser;
export const CommentSchema = LevelCommentSchema;
export type Comment = LevelCommentObject;
export type Submission = SubmissionObject;
export type UserProfile = UserProfileObject;

export type BoundBackendUser = User;
export type Level = LevelContract;
export type PublishedLevel = LevelContract;
export type LevelComment = Comment;
export type LevelRating = Rating;
export type RatingValue = 1 | 2 | 3 | 4 | 5;
export type PlayerFavorite = Favorite;
export type PlayerFavoriteWithLevel = FavoriteWithLevelObject;
export type FavoriteWithLevel = FavoriteWithLevelObject;
export type DesignerLevel = LevelContract;
export type DesignerSubmission = SubmissionObject;
export type PendingSubmission = SubmissionWithLevelObject;
export type SubmissionWithLevel = SubmissionWithLevelObject;
export type ReviewedSubmission = ReviewedSubmissionObject;
export type AdminComment = Comment;
export type DirectorPermissionSummary = DirectorPermissionSummaryObject;
export type ApiUserProfile = UserProfileObject;

export const GetBackendUsersRequestQuerySchema = z.object({});
export type GetBackendUsersRequestQuery = z.infer<typeof GetBackendUsersRequestQuerySchema>;
export const GetBackendUsersResponseDataSchema = z.array(BackendUserSchema);

export const BindBackendUserRequestBodySchema = z.object({
  localUserId: z.string().trim().min(1).max(64),
  nickname: z.string().trim().min(2).max(20),
  role: UserRoleSchema,
});
export type BindBackendUserRequestBody = z.infer<typeof BindBackendUserRequestBodySchema>;
export const BindBackendUserResponseDataSchema = BackendUserSchema;

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
export const ReviewSubmissionResponseDataSchema = ReviewedSubmissionSchema;

export const GetDirectorPermissionsRequestQuerySchema = z.object({});
export const GetDirectorPermissionsResponseDataSchema = DirectorPermissionSummarySchema;

