import { z } from "zod";
import { APIMessage } from "../../../../../system/api/APIMessage.js";

/** Mirrors backend internal API level/api/internal/admin/submissions/ReviewLevelSubmissionInternalApi.scala; not registered as a public frontend route. */
export class ReviewLevelSubmissionInternalAPI extends APIMessage<unknown> {
  readonly submissionId: unknown;
  readonly reviewerId: unknown;
  readonly status: unknown;
  readonly reviewNote: unknown;
  readonly reviewedAt: unknown;
  constructor(submissionId: unknown, reviewerId: unknown, status: unknown, reviewNote: unknown, reviewedAt: unknown) {
    super();
    this.submissionId = submissionId;
    this.reviewerId = reviewerId;
    this.status = status;
    this.reviewNote = reviewNote;
    this.reviewedAt = reviewedAt;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
