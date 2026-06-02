import { ReviewSubmissionRequestBodySchema, ReviewSubmissionRequestParamsSchema, ReviewSubmissionResponseDataSchema, type ReviewSubmissionRequestBody, type ReviewedSubmission } from "../api-contracts.js";
import { request } from "../client.js";

export const reviewSubmission = async (userId: string, submissionId: string, input: ReviewSubmissionRequestBody): Promise<ReviewedSubmission> =>
  request(`/admin/submissions/${ReviewSubmissionRequestParamsSchema.parse({ submissionId }).submissionId}/review`, { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(ReviewSubmissionRequestBodySchema.parse(input)) }, ReviewSubmissionResponseDataSchema);
