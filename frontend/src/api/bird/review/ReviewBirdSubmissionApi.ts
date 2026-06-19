import {
  ReviewBirdSubmissionRequestBodySchema,
  ReviewBirdSubmissionResponseDataSchema,
  type ReviewBirdSubmissionRequestBody,
  type ReviewedBirdSubmission,
} from "../../api-contracts.js";
import { request } from "../../client.js";

export class ReviewBirdSubmissionApi {
  static path(submissionId: string) {
    return `/admin/bird-submissions/${encodeURIComponent(submissionId)}/review` as const;
  }

  async execute(
    userId: string,
    submissionId: string,
    input: ReviewBirdSubmissionRequestBody,
  ): Promise<ReviewedBirdSubmission> {
    const body = ReviewBirdSubmissionRequestBodySchema.parse(input);
    return request(
      ReviewBirdSubmissionApi.path(submissionId),
      {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify(body),
      },
      ReviewBirdSubmissionResponseDataSchema,
    );
  }
}

export const reviewBirdSubmissionApi = new ReviewBirdSubmissionApi();
export const reviewBirdSubmission = async (
  userId: string,
  submissionId: string,
  input: ReviewBirdSubmissionRequestBody,
) => reviewBirdSubmissionApi.execute(userId, submissionId, input);
