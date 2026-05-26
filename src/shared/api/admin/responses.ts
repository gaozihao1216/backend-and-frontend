import { z } from "zod";
import { createSuccessResponseSchema } from "../../schemas/api.js";
import {
  AdminCommentSchema,
  PendingSubmissionSchema,
  ReviewedSubmissionSchema,
} from "./objects.js";

export const GetAdminCommentsResponseDataSchema = z.array(AdminCommentSchema);
export const GetAdminCommentsResponseSchema = createSuccessResponseSchema(
  GetAdminCommentsResponseDataSchema,
);

export const DeleteCommentResponseDataSchema = AdminCommentSchema;
export const DeleteCommentResponseSchema = createSuccessResponseSchema(
  DeleteCommentResponseDataSchema,
);

export const GetPendingSubmissionsResponseDataSchema = z.array(PendingSubmissionSchema);
export const GetPendingSubmissionsResponseSchema = createSuccessResponseSchema(
  GetPendingSubmissionsResponseDataSchema,
);

export const ReviewSubmissionResponseDataSchema = ReviewedSubmissionSchema;
export const ReviewSubmissionResponseSchema = createSuccessResponseSchema(
  ReviewSubmissionResponseDataSchema,
);

export type GetAdminCommentsResponseData = z.infer<typeof GetAdminCommentsResponseDataSchema>;
export type GetAdminCommentsResponse = z.infer<typeof GetAdminCommentsResponseSchema>;
export type DeleteCommentResponseData = z.infer<typeof DeleteCommentResponseDataSchema>;
export type DeleteCommentResponse = z.infer<typeof DeleteCommentResponseSchema>;
export type GetPendingSubmissionsResponseData = z.infer<typeof GetPendingSubmissionsResponseDataSchema>;
export type GetPendingSubmissionsResponse = z.infer<typeof GetPendingSubmissionsResponseSchema>;
export type ReviewSubmissionResponseData = z.infer<typeof ReviewSubmissionResponseDataSchema>;
export type ReviewSubmissionResponse = z.infer<typeof ReviewSubmissionResponseSchema>;
