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
import { DirectorTransferResultSchema, type DirectorTransferResult as DirectorTransferResultObject } from "../objects/admin/director-transfer-result.js";
import {
  AssignLevelSlotRequestBodySchema as AssignLevelSlotRequestBodyInputSchema,
  AbolishDirectorSubmissionRequestBodySchema as AbolishDirectorSubmissionRequestBodyInputSchema,
  DirectorLevelAssignmentBoardSchema,
  LevelSlotAssignmentDetailSchema,
  LevelSlotAssignmentSchema,
  type AssignLevelSlotRequestBody as AssignLevelSlotRequestBodyObject,
  type AbolishDirectorSubmissionRequestBody as AbolishDirectorSubmissionRequestBodyObject,
  type DirectorLevelAssignmentBoard as DirectorLevelAssignmentBoardObject,
  type LevelSlotAssignment as LevelSlotAssignmentObject,
  type LevelSlotAssignmentDetail as LevelSlotAssignmentDetailObject,
} from "../objects/admin/level-slot-assignment.js";
import { ReviewedSubmissionSchema, type ReviewedSubmission as ReviewedSubmissionObject } from "../objects/admin/reviewed-submission.js";
import {
  BirdDesignSchema,
  BirdDesignInputSchema,
  type BirdDesign,
  type BirdDesignInput,
} from "../objects/bird/bird-design.js";
import {
  BirdSubmissionSchema,
  BirdSubmissionWithDesignSchema,
  ReviewedBirdSubmissionSchema,
  type BirdSubmission,
  type BirdSubmissionWithDesign,
  type ReviewedBirdSubmission,
} from "../objects/bird/bird-submission.js";
import { LevelStatusSchema } from "../objects/system/level-status.js";
import { FavoriteSchema, type Favorite } from "../objects/level/favorite.js";
import { FavoriteWithLevelSchema, type FavoriteWithLevel as FavoriteWithLevelObject } from "../objects/level/favorite-with-level.js";
import { LevelCommentSchema, type LevelComment as LevelCommentObject } from "../objects/level/level-comment.js";
import { RatingSchema, type Rating } from "../objects/level/rating.js";
import { SubmissionSchema, type Submission as SubmissionObject } from "../objects/level/submission.js";
import { SubmissionWithLevelSchema, type SubmissionWithLevel as SubmissionWithLevelObject } from "../objects/level/submission-with-level.js";
import { UserProfileSchema, type UserProfile as UserProfileObject } from "../objects/user/user-profile.js";
import { UserRoleSchema } from "../objects/system/user-role.js";
import {
  PageComponentSchema,
  PageConfigSchema,
  ButtonTemplateSchema,
  UiEndpointSchema,
  type PageConfig as PageConfigObject,
  type PageComponent as PageComponentObject,
  type ButtonTemplate as ButtonTemplateObject,
  type UiEndpoint,
} from "../objects/ui-customization/ui-customization-objects.js";

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
export type DesignerBirdDesign = BirdDesign;
export type PendingBirdSubmission = BirdSubmissionWithDesign;
export type { BirdDesign, BirdDesignInput, BirdSubmission, BirdSubmissionWithDesign, ReviewedBirdSubmission };
export {
  BirdDesignSchema,
  BirdDesignInputSchema,
  BirdSubmissionSchema,
  BirdSubmissionWithDesignSchema,
  ReviewedBirdSubmissionSchema,
};
export type AdminComment = Comment;
export type DirectorPermissionSummary = DirectorPermissionSummaryObject;
export type DirectorTransferResult = DirectorTransferResultObject;
export type LevelSlotAssignment = LevelSlotAssignmentObject;
export type LevelSlotAssignmentDetail = LevelSlotAssignmentDetailObject;
export type DirectorLevelAssignmentBoard = DirectorLevelAssignmentBoardObject;
export type AssignLevelSlotRequestBody = AssignLevelSlotRequestBodyObject;
export type AbolishDirectorSubmissionRequestBody = AbolishDirectorSubmissionRequestBodyObject;
export type ApiUserProfile = UserProfileObject;
export type UiPageConfig = PageConfigObject;
export type UiPageComponent = PageComponentObject;
export type UiButtonTemplate = ButtonTemplateObject;

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

export const ListBirdDesignsRequestQuerySchema = z.object({
  status: LevelStatusSchema.optional(),
});
export type ListBirdDesignsRequestQuery = z.infer<typeof ListBirdDesignsRequestQuerySchema>;
export const ListBirdDesignsResponseDataSchema = z.array(BirdDesignSchema);

export const CreateBirdDesignRequestBodySchema = BirdDesignInputSchema;
export type CreateBirdDesignRequestBody = BirdDesignInput;
export const CreateBirdDesignResponseDataSchema = BirdDesignSchema;

export const UpdateBirdDesignRequestBodySchema = BirdDesignInputSchema;
export type UpdateBirdDesignRequestBody = BirdDesignInput;
export const UpdateBirdDesignResponseDataSchema = BirdDesignSchema;

export const DeleteBirdDesignRequestParamsSchema = z.object({
  designId: z.string().min(1),
});
export const DeleteBirdDesignResponseDataSchema = BirdDesignSchema;

export const SubmitBirdDesignRequestParamsSchema = DeleteBirdDesignRequestParamsSchema;
export const SubmitBirdDesignResponseDataSchema = BirdSubmissionSchema;

export const GetPendingBirdSubmissionsRequestQuerySchema = z.object({});
export const GetPendingBirdSubmissionsResponseDataSchema = z.array(BirdSubmissionWithDesignSchema);

export const ReviewBirdSubmissionRequestParamsSchema = z.object({
  submissionId: z.string().min(1),
});
export const ReviewBirdSubmissionRequestBodySchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(1000).optional(),
});
export type ReviewBirdSubmissionRequestBody = z.infer<typeof ReviewBirdSubmissionRequestBodySchema>;
export const ReviewBirdSubmissionResponseDataSchema = ReviewedBirdSubmissionSchema;

export const GetDirectorPermissionsRequestQuerySchema = z.object({});
export const GetDirectorPermissionsResponseDataSchema = DirectorPermissionSummarySchema;

export const TransferDirectorPermissionRequestBodySchema = z.object({
  targetAdminId: z.string().min(1),
});
export type TransferDirectorPermissionRequestBody = z.infer<typeof TransferDirectorPermissionRequestBodySchema>;
export const TransferDirectorPermissionResponseDataSchema = DirectorTransferResultSchema;

export const GetDirectorLevelAssignmentBoardRequestQuerySchema = z.object({});
export const GetDirectorLevelAssignmentBoardResponseDataSchema = DirectorLevelAssignmentBoardSchema;

export const AssignLevelSlotRequestParamsSchema = z.object({
  levelSuffix: z.string().min(1),
});
export const AssignLevelSlotRequestBodySchema = AssignLevelSlotRequestBodyInputSchema;
export const AssignLevelSlotResponseDataSchema = LevelSlotAssignmentDetailSchema;

export const UnassignLevelSlotRequestParamsSchema = AssignLevelSlotRequestParamsSchema;
export const UnassignLevelSlotResponseDataSchema = LevelSlotAssignmentSchema;

export const AbolishDirectorSubmissionRequestParamsSchema = z.object({
  submissionId: z.string().min(1),
});
export const AbolishDirectorSubmissionRequestBodySchema = AbolishDirectorSubmissionRequestBodyInputSchema;
export const AbolishDirectorSubmissionResponseDataSchema = SubmissionWithLevelSchema;

export const ListUiPagesRequestQuerySchema = z.object({
  endpoint: UiEndpointSchema.optional(),
});
export type ListUiPagesRequestQuery = z.infer<typeof ListUiPagesRequestQuerySchema>;
export type UiPageEndpoint = UiEndpoint;
export const ListUiPagesResponseDataSchema = z.array(PageConfigSchema);

export const GetUiPageRequestParamsSchema = z.object({
  pageId: z.string().min(1),
});
export const GetUiPageResponseDataSchema = PageConfigSchema;

export const CreateUiPageRequestBodySchema = z.object({
  page: PageConfigSchema,
});
export type CreateUiPageRequestBody = z.infer<typeof CreateUiPageRequestBodySchema>;
export const CreateUiPageResponseDataSchema = PageConfigSchema;

export const UpdateUiPageRequestParamsSchema = GetUiPageRequestParamsSchema;
export const UpdateUiPageRequestBodySchema = CreateUiPageRequestBodySchema;
export type UpdateUiPageRequestBody = z.infer<typeof UpdateUiPageRequestBodySchema>;
export const UpdateUiPageResponseDataSchema = PageConfigSchema;

export const DeleteUiPageRequestParamsSchema = GetUiPageRequestParamsSchema;
export const DeleteUiPageResponseDataSchema = PageConfigSchema;

export const CreatePageComponentRequestParamsSchema = GetUiPageRequestParamsSchema;
export const CreatePageComponentRequestBodySchema = z.object({
  component: PageComponentSchema,
});
export type CreatePageComponentRequestBody = z.infer<typeof CreatePageComponentRequestBodySchema>;
export const CreatePageComponentResponseDataSchema = PageConfigSchema;

export const UpdatePageComponentRequestParamsSchema = z.object({
  pageId: z.string().min(1),
  componentId: z.string().min(1),
});
export const UpdatePageComponentRequestBodySchema = CreatePageComponentRequestBodySchema;
export type UpdatePageComponentRequestBody = z.infer<typeof UpdatePageComponentRequestBodySchema>;
export const UpdatePageComponentResponseDataSchema = PageConfigSchema;

export const DeletePageComponentRequestParamsSchema = UpdatePageComponentRequestParamsSchema;
export const DeletePageComponentResponseDataSchema = PageConfigSchema;

export const ListButtonTemplatesRequestQuerySchema = z.object({});
export const ListButtonTemplatesResponseDataSchema = z.array(ButtonTemplateSchema);

export const GetButtonTemplateRequestParamsSchema = z.object({
  templateId: z.string().min(1),
});
export const GetButtonTemplateResponseDataSchema = ButtonTemplateSchema;

export const CreateButtonTemplateRequestBodySchema = z.object({
  template: ButtonTemplateSchema,
});
export type CreateButtonTemplateRequestBody = z.infer<typeof CreateButtonTemplateRequestBodySchema>;
export const CreateButtonTemplateResponseDataSchema = ButtonTemplateSchema;

export const UpdateButtonTemplateRequestParamsSchema = GetButtonTemplateRequestParamsSchema;
export const UpdateButtonTemplateRequestBodySchema = CreateButtonTemplateRequestBodySchema;
export type UpdateButtonTemplateRequestBody = z.infer<typeof UpdateButtonTemplateRequestBodySchema>;
export const UpdateButtonTemplateResponseDataSchema = ButtonTemplateSchema;

export const DeleteButtonTemplateRequestParamsSchema = GetButtonTemplateRequestParamsSchema;
export const DeleteButtonTemplateResponseDataSchema = ButtonTemplateSchema;

export {
  StretchVisualTemplateKindSchema,
  StretchVisualTemplateSchema,
} from "../objects/ui-customization/stretch-visual-template.js";
export type {
  StretchVisualTemplateKind,
  StretchVisualTemplate as UiStretchVisualTemplate,
} from "../objects/ui-customization/stretch-visual-template.js";

import { StretchVisualTemplateSchema } from "../objects/ui-customization/stretch-visual-template.js";

export const ListStretchVisualTemplatesResponseDataSchema = z.array(StretchVisualTemplateSchema);

export const CreateStretchVisualTemplateRequestBodySchema = z.object({
  template: StretchVisualTemplateSchema,
});
export type CreateStretchVisualTemplateRequestBody = z.infer<typeof CreateStretchVisualTemplateRequestBodySchema>;
export const CreateStretchVisualTemplateResponseDataSchema = StretchVisualTemplateSchema;

export const UpdateStretchVisualTemplateRequestParamsSchema = GetButtonTemplateRequestParamsSchema;
export const UpdateStretchVisualTemplateRequestBodySchema = CreateStretchVisualTemplateRequestBodySchema;
export type UpdateStretchVisualTemplateRequestBody = z.infer<typeof UpdateStretchVisualTemplateRequestBodySchema>;
export const UpdateStretchVisualTemplateResponseDataSchema = StretchVisualTemplateSchema;

export const DeleteStretchVisualTemplateRequestParamsSchema = GetButtonTemplateRequestParamsSchema;
export const DeleteStretchVisualTemplateResponseDataSchema = StretchVisualTemplateSchema;

