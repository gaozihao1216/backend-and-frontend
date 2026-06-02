import { z } from "zod";
import {
  BindBackendUserInputSchema,
  CommentSchema,
  CreateCommentInputSchema,
  CreateLevelInputSchema,
  CreateRatingInputSchema,
  FavoriteSchema,
  LevelSchema,
  ReviewSubmissionInputSchema,
  SubmissionSchema,
  UserProfileSchema,
  UserSchema,
  type BindBackendUserInput,
  type Comment,
  type CreateCommentInput,
  type CreateLevelInput,
  type CreateRatingInput,
  type Favorite,
  type Level,
  type ReviewSubmissionInput,
  type Submission,
  type User,
  type UserProfile,
  type LevelTag,
  type PublishedLevelsSort,
} from "../domain/store-contracts.js";

export const GetBackendUsersRequestQuerySchema = z.object({});
export const GetBackendUsersResponseDataSchema = z.array(UserSchema);
export type BoundBackendUser = User;
export const BindBackendUserRequestBodySchema = BindBackendUserInputSchema;
export type BindBackendUserRequestBody = BindBackendUserInput;
export const BindBackendUserResponseDataSchema = UserSchema;

export const GetUserProfileRequestQuerySchema = z.object({});
export const GetUserProfileRequestParamsSchema = z.object({
  userId: z.string().min(1),
});
export const GetUserProfileResponseDataSchema = UserProfileSchema;
export type ApiUserProfile = UserProfile;

export const CreateLevelRequestBodySchema = CreateLevelInputSchema;
export type CreateLevelRequestBody = CreateLevelInput;
export const CreateLevelResponseDataSchema = LevelSchema;
export type DesignerLevel = Level;

export const SubmitLevelRequestBodySchema = z.object({
  levelId: z.string().min(1),
});
export const SubmitLevelResponseDataSchema = SubmissionSchema;
export type DesignerSubmission = Submission;

export const GetPublishedLevelsRequestQuerySchema = z.object({
  tag: z.enum(["puzzle", "hard", "beginner", "funny", "strategy"]).optional(),
  sort: z.enum(["newest", "highestRated", "mostRated"]).default("newest"),
});
export type GetPublishedLevelsRequestQuery = z.infer<typeof GetPublishedLevelsRequestQuerySchema>;
export const GetPublishedLevelsResponseDataSchema = z.array(LevelSchema);
export type PublishedLevel = Level;

export const GetPublishedLevelRequestParamsSchema = z.object({
  levelId: z.string().min(1),
});
export const GetPublishedLevelResponseDataSchema = LevelSchema;

export const GetFavoriteLevelsRequestQuerySchema = z.object({});
export const GetFavoriteLevelsResponseDataSchema = z.array(z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  userId: z.string().min(1),
  createdAt: z.string(),
  level: LevelSchema,
}));
export type PlayerFavorite = Favorite;
export type PlayerFavoriteWithLevel = z.infer<typeof GetFavoriteLevelsResponseDataSchema>[number];

export const FavoriteLevelRequestParamsSchema = z.object({
  levelId: z.string().min(1),
});
export const FavoriteLevelResponseDataSchema = FavoriteSchema;
export const UnfavoriteLevelRequestParamsSchema = FavoriteLevelRequestParamsSchema;
export const UnfavoriteLevelResponseDataSchema = FavoriteSchema;

export const RateLevelRequestParamsSchema = z.object({
  levelId: z.string().min(1),
});
export const RateLevelRequestBodySchema = CreateRatingInputSchema;
export type RateLevelRequestBody = CreateRatingInput;
export const RateLevelResponseDataSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  playerId: z.string().min(1),
  score: z.number().int().min(1).max(5),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LevelRating = z.infer<typeof RateLevelResponseDataSchema>;

export const GetLevelCommentsRequestParamsSchema = z.object({
  levelId: z.string().min(1),
});
export const GetLevelCommentsResponseDataSchema = z.array(CommentSchema);
export type LevelComment = Comment;

export const CreateCommentRequestParamsSchema = GetLevelCommentsRequestParamsSchema;
export const CreateCommentRequestBodySchema = CreateCommentInputSchema;
export type CreateCommentRequestBody = CreateCommentInput;
export const CreateCommentResponseDataSchema = CommentSchema;

export const GetAdminCommentsRequestQuerySchema = z.object({});
export const GetAdminCommentsResponseDataSchema = z.array(CommentSchema);
export type AdminComment = Comment;

export const DeleteCommentRequestParamsSchema = z.object({
  commentId: z.string().min(1),
});
export const DeleteCommentResponseDataSchema = CommentSchema;

export const GetPendingSubmissionsRequestQuerySchema = z.object({});
export const GetPendingSubmissionsResponseDataSchema = z.array(
  SubmissionSchema.extend({
    level: LevelSchema,
  }),
);
export type PendingSubmission = z.infer<typeof GetPendingSubmissionsResponseDataSchema>[number];

export const ReviewSubmissionRequestParamsSchema = z.object({
  submissionId: z.string().min(1),
});
export const ReviewSubmissionRequestBodySchema = ReviewSubmissionInputSchema;
export type ReviewSubmissionRequestBody = ReviewSubmissionInput;
export const ReviewSubmissionResponseDataSchema = SubmissionSchema;
export type ReviewedSubmission = Submission;
