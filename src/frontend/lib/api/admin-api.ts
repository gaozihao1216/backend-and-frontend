import {
  DeleteCommentResponseDataSchema,
  GetAdminCommentsResponseDataSchema,
  GetPendingSubmissionsResponseDataSchema,
  ReviewSubmissionRequestBodySchema,
  ReviewSubmissionResponseDataSchema,
  type AdminComment,
  type PendingSubmission,
  type ReviewSubmissionRequestBody,
  type ReviewedSubmission,
} from "../../../shared/types.js";
import { request } from "./client.js";

export const getPendingSubmissions = async (userId: string): Promise<PendingSubmission[]> =>
  request(
    "/admin/submissions/pending",
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    GetPendingSubmissionsResponseDataSchema,
  );

export const reviewSubmission = async (
  userId: string,
  submissionId: string,
  input: ReviewSubmissionRequestBody,
): Promise<ReviewedSubmission> =>
  request(
    `/admin/submissions/${submissionId}/review`,
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(ReviewSubmissionRequestBodySchema.parse(input)),
    },
    ReviewSubmissionResponseDataSchema,
  );

export const getAdminComments = async (userId: string): Promise<AdminComment[]> =>
  request(
    "/admin/comments",
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    GetAdminCommentsResponseDataSchema,
  );

export const deleteComment = async (userId: string, commentId: string): Promise<AdminComment> =>
  request(
    `/admin/comments/${commentId}`,
    {
      method: "DELETE",
      headers: { "x-user-id": userId },
    },
    DeleteCommentResponseDataSchema,
  );
