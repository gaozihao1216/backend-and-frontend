import { z } from "zod";
import {
  LevelDataSchema,
  LevelEnemySchema,
  LevelObstacleSchema,
  type LevelData,
  type LevelEnemy,
  type LevelObstacle,
} from "../level/level/level-data.js";
import { LevelSchema, type Level as LevelContract } from "../level/level/level.js";
import { LevelTagSchema, type LevelTag, type PublishedLevelsSort } from "../system/system-objects.js";
import type { LevelGround } from "../level/terrain/level-ground.js";
import type { LevelTerrain, TerrainVoidSpan } from "../level/terrain/level-terrain.js";
import type { Position } from "../level/terrain/position.js";
import type { CreateLevelInput } from "../level/level/create-level-input.js";
import {
  CreateLevelRequestBodySchema as CreateLevelRequestBodyInputSchema,
  type CreateLevelRequestBody as CreateLevelRequestBodyObject,
} from "../level/design/request/CreateLevelRequest.js";
import {
  SubmitLevelRequestBodySchema as SubmitLevelRequestBodyInputSchema,
} from "../level/design/request/SubmitLevelRequest.js";
import {
  RateLevelRequestBodySchema as RateLevelRequestBodyInputSchema,
  type RateLevelRequestBody as RateLevelRequestBodyObject,
} from "../level/player/request/RateLevelRequest.js";
import {
  CreateCommentRequestBodySchema as CreateCommentRequestBodyInputSchema,
  type CreateCommentRequestBody as CreateCommentRequestBodyObject,
} from "../level/player/request/CreateLevelCommentRequest.js";
import {
  ReviewSubmissionRequestBodySchema as ReviewSubmissionRequestBodyInputSchema,
  type ReviewSubmissionRequestBody as ReviewSubmissionRequestBodyObject,
} from "../admin/submission/request/ReviewSubmissionRequest.js";
import {
  CreateBirdDesignRequestBodySchema as CreateBirdDesignRequestBodyInputSchema,
  type CreateBirdDesignRequestBody as CreateBirdDesignRequestBodyObject,
} from "../bird/design/request/CreateBirdDesignRequest.js";
import {
  UpdateBirdDesignRequestBodySchema as UpdateBirdDesignRequestBodyInputSchema,
  type UpdateBirdDesignRequestBody as UpdateBirdDesignRequestBodyObject,
} from "../bird/design/request/UpdateBirdDesignRequest.js";
import {
  ReviewBirdSubmissionRequestBodySchema as ReviewBirdSubmissionRequestBodyInputSchema,
  type ReviewBirdSubmissionRequestBody as ReviewBirdSubmissionRequestBodyObject,
} from "../bird/submission/request/ReviewBirdSubmissionRequest.js";
import {
  TransferDirectorPermissionRequestBodySchema as TransferDirectorPermissionRequestBodyInputSchema,
  type TransferDirectorPermissionRequestBody as TransferDirectorPermissionRequestBodyObject,
} from "../admin/director/permissions/request/TransferDirectorPermissionRequest.js";
import {
  CreateUiPageRequestBodySchema as CreateUiPageRequestBodyInputSchema,
  type CreateUiPageRequestBody as CreateUiPageRequestBodyObject,
} from "../ui/page/request/CreateUiPageRequest.js";
import {
  UpdateUiPageRequestBodySchema as UpdateUiPageRequestBodyInputSchema,
  type UpdateUiPageRequestBody as UpdateUiPageRequestBodyObject,
} from "../ui/page/request/UpdateUiPageRequest.js";
import {
  CreatePageComponentRequestBodySchema as CreatePageComponentRequestBodyInputSchema,
  type CreatePageComponentRequestBody as CreatePageComponentRequestBodyObject,
} from "../ui/component/request/CreatePageComponentRequest.js";
import {
  UpdatePageComponentRequestBodySchema as UpdatePageComponentRequestBodyInputSchema,
  type UpdatePageComponentRequestBody as UpdatePageComponentRequestBodyObject,
} from "../ui/component/request/UpdatePageComponentRequest.js";
import {
  CreateButtonTemplateRequestBodySchema as CreateButtonTemplateRequestBodyInputSchema,
  type CreateButtonTemplateRequestBody as CreateButtonTemplateRequestBodyObject,
} from "../ui/button_template/request/CreateButtonTemplateRequest.js";
import {
  UpdateButtonTemplateRequestBodySchema as UpdateButtonTemplateRequestBodyInputSchema,
  type UpdateButtonTemplateRequestBody as UpdateButtonTemplateRequestBodyObject,
} from "../ui/button_template/request/UpdateButtonTemplateRequest.js";
import {
  CreateStretchVisualTemplateRequestBodySchema as CreateStretchVisualTemplateRequestBodyInputSchema,
  type CreateStretchVisualTemplateRequestBody as CreateStretchVisualTemplateRequestBodyObject,
} from "../ui/stretch_template/request/CreateStretchVisualTemplateRequest.js";
import {
  UpdateStretchVisualTemplateRequestBodySchema as UpdateStretchVisualTemplateRequestBodyInputSchema,
  type UpdateStretchVisualTemplateRequestBody as UpdateStretchVisualTemplateRequestBodyObject,
} from "../ui/stretch_template/request/UpdateStretchVisualTemplateRequest.js";
import { BackendUserSchema, type BackendUser } from "../auth/backend-user.js";
import { DirectorPermissionSummarySchema, type DirectorPermissionSummary as DirectorPermissionSummaryObject } from "../admin/director/permissions/director-permission-summary.js";
import { DirectorTransferResultSchema, type DirectorTransferResult as DirectorTransferResultObject } from "../admin/director/permissions/director-transfer-result.js";
import {
  AssignLevelSlotRequestBodySchema as AssignLevelSlotRequestBodyInputSchema,
  type AssignLevelSlotRequestBody as AssignLevelSlotRequestBodyObject,
} from "../admin/director/level_assignment/request/AssignLevelSlotRequest.js";
import {
  AbolishDirectorSubmissionRequestBodySchema as AbolishDirectorSubmissionRequestBodyInputSchema,
  type AbolishDirectorSubmissionRequestBody as AbolishDirectorSubmissionRequestBodyObject,
} from "../admin/director/level_assignment/request/AbolishDirectorSubmissionRequest.js";
import {
  LevelSlotAssignmentDetailSchema,
  LevelSlotAssignmentSchema,
  type LevelSlotAssignment as LevelSlotAssignmentObject,
  type LevelSlotAssignmentDetail as LevelSlotAssignmentDetailObject,
} from "../admin/director/level_assignment/assignment/level-slot-assignment.js";
import {
  DirectorLevelAssignmentBoardSchema,
  type DirectorLevelAssignmentBoard as DirectorLevelAssignmentBoardObject,
} from "../admin/director/level_assignment/board/director-level-assignment-board.js";
import { ReviewedSubmissionSchema, type ReviewedSubmission as ReviewedSubmissionObject } from "../admin/submission/reviewed-submission.js";
import {
  ReviewAuditSchema,
  ListAdminAuditLogsRequestQuerySchema as ListAdminAuditLogsRequestQueryInputSchema,
  type ReviewAudit as ReviewAuditObject,
} from "../admin/submission/review-audit.js";
import {
  ShopItemSchema,
  type ShopItem as ShopItemObject,
} from "../player/shop/shop-item.js";
import {
  CreateShopItemRequestBodySchema as CreateShopItemRequestBodyInputSchema,
  type CreateShopItemRequestBody as CreateShopItemRequestBodyObject,
} from "../admin/shop/request/CreateShopItemRequest.js";
import {
  UpdateShopItemRequestBodySchema as UpdateShopItemRequestBodyInputSchema,
  type UpdateShopItemRequestBody as UpdateShopItemRequestBodyObject,
} from "../admin/shop/request/UpdateShopItemRequest.js";
import {
  BirdDesignSchema,
  BirdDesignInputSchema,
  type BirdDesign,
  type BirdDesignInput,
} from "../bird/design/bird-design.js";
import {
  BirdSubmissionSchema,
  BirdSubmissionWithDesignSchema,
  ReviewedBirdSubmissionSchema,
  type BirdSubmission,
  type BirdSubmissionWithDesign,
  type ReviewedBirdSubmission,
} from "../bird/submission/bird-submission.js";
import { LevelStatusSchema } from "../system/level-status.js";
import { FavoriteSchema, type Favorite } from "../level/social/favorite.js";
import { FavoriteWithLevelSchema, type FavoriteWithLevel as FavoriteWithLevelObject } from "../level/social/favorite-with-level.js";
import { LevelCommentSchema, type LevelComment as LevelCommentObject } from "../level/social/level-comment.js";
import { RatingSchema, type Rating } from "../level/social/rating.js";
import { SubmissionSchema, type Submission as SubmissionObject } from "../level/submission/submission.js";
import { SubmissionWithLevelSchema, type SubmissionWithLevel as SubmissionWithLevelObject } from "../level/submission/submission-with-level.js";
import { UserProfileSchema, type UserProfile as UserProfileObject } from "../user/user-profile.js";
import { UserRoleSchema } from "../system/user-role.js";
import {
  PageComponentSchema,
  PageConfigSchema,
  ButtonTemplateSchema,
  UiEndpointSchema,
  type PageConfig as PageConfigObject,
  type PageComponent as PageComponentObject,
  type ButtonTemplate as ButtonTemplateObject,
  type UiEndpoint,
} from "../ui-customization/ui-customization-objects.js";

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

export const CreateLevelRequestBodySchema = CreateLevelRequestBodyInputSchema;
export type CreateLevelRequestBody = CreateLevelRequestBodyObject;
export const CreateLevelResponseDataSchema = LevelSchema;

export const SubmitLevelRequestBodySchema = SubmitLevelRequestBodyInputSchema;
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
export const RateLevelRequestBodySchema = RateLevelRequestBodyInputSchema;
export type RateLevelRequestBody = RateLevelRequestBodyObject;
export const RateLevelResponseDataSchema = RatingSchema;

export const GetLevelCommentsRequestParamsSchema = z.object({
  levelId: z.string().min(1),
});
export const GetLevelCommentsResponseDataSchema = z.array(CommentSchema);

export const CreateCommentRequestParamsSchema = GetLevelCommentsRequestParamsSchema;
export const CreateCommentRequestBodySchema = CreateCommentRequestBodyInputSchema;
export type CreateCommentRequestBody = CreateCommentRequestBodyObject;
export const CreateCommentResponseDataSchema = CommentSchema;

export const GetAdminCommentsRequestQuerySchema = z.object({});
export const GetAdminCommentsResponseDataSchema = z.array(CommentSchema);
export const DeleteCommentRequestParamsSchema = z.object({
  commentId: z.string().min(1),
});
export const DeleteCommentResponseDataSchema = CommentSchema;

export const ListAdminAuditLogsRequestQuerySchema = ListAdminAuditLogsRequestQueryInputSchema;
export type ListAdminAuditLogsRequestQuery = z.infer<typeof ListAdminAuditLogsRequestQuerySchema>;
export type ReviewAudit = ReviewAuditObject;
export const ListAdminAuditLogsResponseDataSchema = z.array(ReviewAuditSchema);

export const ListAdminShopItemsRequestQuerySchema = z.object({});
export type ShopItem = ShopItemObject;
export const ListAdminShopItemsResponseDataSchema = z.array(ShopItemSchema);
export const CreateShopItemRequestBodySchema = CreateShopItemRequestBodyInputSchema;
export type CreateShopItemRequestBody = CreateShopItemRequestBodyObject;
export const CreateShopItemResponseDataSchema = ShopItemSchema;
export const UpdateShopItemRequestParamsSchema = z.object({ itemId: z.string().min(1) });
export const UpdateShopItemRequestBodySchema = UpdateShopItemRequestBodyInputSchema;
export type UpdateShopItemRequestBody = UpdateShopItemRequestBodyObject;
export const UpdateShopItemResponseDataSchema = ShopItemSchema;
export const DeactivateShopItemRequestParamsSchema = UpdateShopItemRequestParamsSchema;
export const DeactivateShopItemResponseDataSchema = ShopItemSchema;

export const GetPendingSubmissionsRequestQuerySchema = z.object({});
export const GetPendingSubmissionsResponseDataSchema = z.array(SubmissionWithLevelSchema);
export const ReviewSubmissionRequestParamsSchema = z.object({
  submissionId: z.string().min(1),
});
export const ReviewSubmissionRequestBodySchema = ReviewSubmissionRequestBodyInputSchema;
export type ReviewSubmissionRequestBody = ReviewSubmissionRequestBodyObject;
export const ReviewSubmissionResponseDataSchema = ReviewedSubmissionSchema;

export const ListBirdDesignsRequestQuerySchema = z.object({
  status: LevelStatusSchema.optional(),
});
export type ListBirdDesignsRequestQuery = z.infer<typeof ListBirdDesignsRequestQuerySchema>;
export const ListBirdDesignsResponseDataSchema = z.array(BirdDesignSchema);

export const CreateBirdDesignRequestBodySchema = CreateBirdDesignRequestBodyInputSchema;
export type CreateBirdDesignRequestBody = CreateBirdDesignRequestBodyObject;
export const CreateBirdDesignResponseDataSchema = BirdDesignSchema;

export const UpdateBirdDesignRequestBodySchema = UpdateBirdDesignRequestBodyInputSchema;
export type UpdateBirdDesignRequestBody = UpdateBirdDesignRequestBodyObject;
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
export const ReviewBirdSubmissionRequestBodySchema = ReviewBirdSubmissionRequestBodyInputSchema;
export type ReviewBirdSubmissionRequestBody = ReviewBirdSubmissionRequestBodyObject;
export const ReviewBirdSubmissionResponseDataSchema = ReviewedBirdSubmissionSchema;

export const GetDirectorPermissionsRequestQuerySchema = z.object({});
export const GetDirectorPermissionsResponseDataSchema = DirectorPermissionSummarySchema;

export const TransferDirectorPermissionRequestBodySchema = TransferDirectorPermissionRequestBodyInputSchema;
export type TransferDirectorPermissionRequestBody = TransferDirectorPermissionRequestBodyObject;
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

export const CreateUiPageRequestBodySchema = CreateUiPageRequestBodyInputSchema;
export type CreateUiPageRequestBody = CreateUiPageRequestBodyObject;
export const CreateUiPageResponseDataSchema = PageConfigSchema;

export const UpdateUiPageRequestParamsSchema = GetUiPageRequestParamsSchema;
export const UpdateUiPageRequestBodySchema = UpdateUiPageRequestBodyInputSchema;
export type UpdateUiPageRequestBody = UpdateUiPageRequestBodyObject;
export const UpdateUiPageResponseDataSchema = PageConfigSchema;

export const DeleteUiPageRequestParamsSchema = GetUiPageRequestParamsSchema;
export const DeleteUiPageResponseDataSchema = PageConfigSchema;

export const CreatePageComponentRequestParamsSchema = GetUiPageRequestParamsSchema;
export const CreatePageComponentRequestBodySchema = CreatePageComponentRequestBodyInputSchema;
export type CreatePageComponentRequestBody = CreatePageComponentRequestBodyObject;
export const CreatePageComponentResponseDataSchema = PageConfigSchema;

export const UpdatePageComponentRequestParamsSchema = z.object({
  pageId: z.string().min(1),
  componentId: z.string().min(1),
});
export const UpdatePageComponentRequestBodySchema = UpdatePageComponentRequestBodyInputSchema;
export type UpdatePageComponentRequestBody = UpdatePageComponentRequestBodyObject;
export const UpdatePageComponentResponseDataSchema = PageConfigSchema;

export const DeletePageComponentRequestParamsSchema = UpdatePageComponentRequestParamsSchema;
export const DeletePageComponentResponseDataSchema = PageConfigSchema;

export const ListButtonTemplatesRequestQuerySchema = z.object({});
export const ListButtonTemplatesResponseDataSchema = z.array(ButtonTemplateSchema);

export const GetButtonTemplateRequestParamsSchema = z.object({
  templateId: z.string().min(1),
});
export const GetButtonTemplateResponseDataSchema = ButtonTemplateSchema;

export const CreateButtonTemplateRequestBodySchema = CreateButtonTemplateRequestBodyInputSchema;
export type CreateButtonTemplateRequestBody = CreateButtonTemplateRequestBodyObject;
export const CreateButtonTemplateResponseDataSchema = ButtonTemplateSchema;

export const UpdateButtonTemplateRequestParamsSchema = GetButtonTemplateRequestParamsSchema;
export const UpdateButtonTemplateRequestBodySchema = UpdateButtonTemplateRequestBodyInputSchema;
export type UpdateButtonTemplateRequestBody = UpdateButtonTemplateRequestBodyObject;
export const UpdateButtonTemplateResponseDataSchema = ButtonTemplateSchema;

export const DeleteButtonTemplateRequestParamsSchema = GetButtonTemplateRequestParamsSchema;
export const DeleteButtonTemplateResponseDataSchema = ButtonTemplateSchema;

export {
  StretchVisualTemplateKindSchema,
  StretchVisualTemplateSchema,
} from "../ui/stretch_template/stretch-visual-template.js";
export type {
  StretchVisualTemplateKind,
  StretchVisualTemplate as UiStretchVisualTemplate,
} from "../ui/stretch_template/stretch-visual-template.js";

import { StretchVisualTemplateSchema } from "../ui/stretch_template/stretch-visual-template.js";

export const ListStretchVisualTemplatesResponseDataSchema = z.array(StretchVisualTemplateSchema);

export const CreateStretchVisualTemplateRequestBodySchema = CreateStretchVisualTemplateRequestBodyInputSchema;
export type CreateStretchVisualTemplateRequestBody = CreateStretchVisualTemplateRequestBodyObject;
export const CreateStretchVisualTemplateResponseDataSchema = StretchVisualTemplateSchema;

export const UpdateStretchVisualTemplateRequestParamsSchema = GetButtonTemplateRequestParamsSchema;
export const UpdateStretchVisualTemplateRequestBodySchema = UpdateStretchVisualTemplateRequestBodyInputSchema;
export type UpdateStretchVisualTemplateRequestBody = UpdateStretchVisualTemplateRequestBodyObject;
export const UpdateStretchVisualTemplateResponseDataSchema = StretchVisualTemplateSchema;

export const DeleteStretchVisualTemplateRequestParamsSchema = GetButtonTemplateRequestParamsSchema;
export const DeleteStretchVisualTemplateResponseDataSchema = StretchVisualTemplateSchema;
