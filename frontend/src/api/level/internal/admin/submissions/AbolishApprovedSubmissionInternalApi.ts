import { z } from "zod";
import { APIMessage } from "../../../../../system/api/APIMessage.js";

/** Mirrors backend internal API level/api/internal/admin/submissions/AbolishApprovedSubmissionInternalApi.scala; not registered as a public frontend route. */
export class AbolishApprovedSubmissionInternalAPI extends APIMessage<unknown> {
  readonly submissionId: unknown;
  readonly reviewerId: unknown;
  readonly note: unknown;
  constructor(submissionId: unknown, reviewerId: unknown, note: unknown) {
    super();
    this.submissionId = submissionId;
    this.reviewerId = reviewerId;
    this.note = note;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
