import { ReviewSubmissionRequestBodySchema, ReviewSubmissionRequestParamsSchema, ReviewSubmissionResponseDataSchema, type ReviewSubmissionRequestBody, type ReviewedSubmission } from "../api-contracts.js";
import { request } from "../client.js";

export const reviewSubmissionApiPath = (submissionId: string) => `/admin/submissions/${submissionId}/review` as const;

export const reviewSubmission = async (userId: string, submissionId: string, input: ReviewSubmissionRequestBody): Promise<ReviewedSubmission> =>
  request(reviewSubmissionApiPath(ReviewSubmissionRequestParamsSchema.parse({ submissionId }).submissionId), { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(ReviewSubmissionRequestBodySchema.parse(input)) }, ReviewSubmissionResponseDataSchema);
