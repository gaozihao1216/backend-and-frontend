import { ReviewSubmissionRequestBodySchema, ReviewSubmissionRequestParamsSchema, ReviewSubmissionResponseDataSchema, type ReviewSubmissionRequestBody, type ReviewedSubmission } from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";

export const reviewSubmissionApiPath = (submissionId: string) => `/admin/submissions/${submissionId}/review` as const;

export class ReviewSubmissionApi {
  path(submissionId: string): string {
    return reviewSubmissionApiPath(submissionId);
  }

  async execute(userId: string, submissionId: string, input: ReviewSubmissionRequestBody): Promise<ReviewedSubmission> {
    const params = ReviewSubmissionRequestParamsSchema.parse({ submissionId });
    return request(
      this.path(params.submissionId),
      { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(ReviewSubmissionRequestBodySchema.parse(input)) },
      ReviewSubmissionResponseDataSchema,
    );
  }
}

export const reviewSubmissionApi = new ReviewSubmissionApi();

export const reviewSubmission = async (userId: string, submissionId: string, input: ReviewSubmissionRequestBody): Promise<ReviewedSubmission> =>
  reviewSubmissionApi.execute(userId, submissionId, input);
