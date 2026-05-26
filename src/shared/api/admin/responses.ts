import { z } from "zod";
import { createSuccessResponseSchema } from "../../schemas/api.js";
import { CommentSchema } from "../../schemas/comment.js";
import { SubmissionSchema, SubmissionWithLevelSchema } from "../../schemas/submission.js";

export const GetAdminCommentsResponseDataSchema = z.array(CommentSchema);
export const GetAdminCommentsResponseSchema = createSuccessResponseSchema(
  GetAdminCommentsResponseDataSchema,
);

export const DeleteCommentResponseDataSchema = CommentSchema;
export const DeleteCommentResponseSchema = createSuccessResponseSchema(
  DeleteCommentResponseDataSchema,
);

export const GetPendingSubmissionsResponseDataSchema = z.array(SubmissionWithLevelSchema);
export const GetPendingSubmissionsResponseSchema = createSuccessResponseSchema(
  GetPendingSubmissionsResponseDataSchema,
);

export const ReviewSubmissionResponseDataSchema = SubmissionSchema;
export const ReviewSubmissionResponseSchema = createSuccessResponseSchema(
  ReviewSubmissionResponseDataSchema,
);

export type GetAdminCommentsResponseData = z.infer<typeof GetAdminCommentsResponseDataSchema>;
export type DeleteCommentResponseData = z.infer<typeof DeleteCommentResponseDataSchema>;
export type GetPendingSubmissionsResponseData = z.infer<typeof GetPendingSubmissionsResponseDataSchema>;
export type ReviewSubmissionResponseData = z.infer<typeof ReviewSubmissionResponseDataSchema>;
