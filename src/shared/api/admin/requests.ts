import { z } from "zod";
import { CommentIdParamsSchema } from "../../schemas/comment.js";
import { ReviewSubmissionInputSchema, SubmissionIdParamsSchema } from "../../schemas/submission.js";

export const GetAdminCommentsRequestQuerySchema = z.object({});
export const DeleteCommentRequestParamsSchema = CommentIdParamsSchema;
export const GetPendingSubmissionsRequestQuerySchema = z.object({});
export const ReviewSubmissionRequestParamsSchema = SubmissionIdParamsSchema;
export const ReviewSubmissionRequestBodySchema = ReviewSubmissionInputSchema;

export type GetAdminCommentsRequestQuery = z.infer<typeof GetAdminCommentsRequestQuerySchema>;
export type DeleteCommentRequestParams = z.infer<typeof DeleteCommentRequestParamsSchema>;
export type GetPendingSubmissionsRequestQuery = z.infer<typeof GetPendingSubmissionsRequestQuerySchema>;
export type ReviewSubmissionRequestParams = z.infer<typeof ReviewSubmissionRequestParamsSchema>;
export type ReviewSubmissionRequestBody = z.infer<typeof ReviewSubmissionRequestBodySchema>;
