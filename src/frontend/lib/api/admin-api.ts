import {
  DeleteCommentRequestParamsSchema,
  DeleteCommentResponseDataSchema,
  GetAdminCommentsRequestQuerySchema,
  GetAdminCommentsResponseDataSchema,
  GetPendingSubmissionsRequestQuerySchema,
  GetPendingSubmissionsResponseDataSchema,
  ReviewSubmissionRequestBodySchema,
  ReviewSubmissionRequestParamsSchema,
  ReviewSubmissionResponseDataSchema,
  type AdminComment,
  type PendingSubmission,
  type ReviewSubmissionRequestBody,
  type ReviewedSubmission,
} from "./api-contracts.js";
import { request } from "./client.js";

export const getPendingSubmissions = async (userId: string): Promise<PendingSubmission[]> => {
  GetPendingSubmissionsRequestQuerySchema.parse({});

  return request(
    "/admin/submissions/pending",
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    GetPendingSubmissionsResponseDataSchema,
  );
};

export const reviewSubmission = async (
  userId: string,
  submissionId: string,
  input: ReviewSubmissionRequestBody,
): Promise<ReviewedSubmission> =>
  request(
    `/admin/submissions/${ReviewSubmissionRequestParamsSchema.parse({ submissionId }).submissionId}/review`,
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(ReviewSubmissionRequestBodySchema.parse(input)),
    },
    ReviewSubmissionResponseDataSchema,
  );

export const getAdminComments = async (userId: string): Promise<AdminComment[]> => {
  GetAdminCommentsRequestQuerySchema.parse({});

  return request(
    "/admin/comments",
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    GetAdminCommentsResponseDataSchema,
  );
};

export const deleteComment = async (userId: string, commentId: string): Promise<AdminComment> =>
  request(
    `/admin/comments/${DeleteCommentRequestParamsSchema.parse({ commentId }).commentId}`,
    {
      method: "DELETE",
      headers: { "x-user-id": userId },
    },
    DeleteCommentResponseDataSchema,
  );
