import { z } from "zod";
import { APIMessage } from "../../../system/api/APIMessage.js";

/** Mirrors backend internal API admin/api/internal/RecordReviewAuditInternalApi.scala; not registered as a public frontend route. */
export class RecordReviewAuditInternalAPI extends APIMessage<unknown> {
  readonly targetType: unknown;
  readonly submissionId: unknown;
  readonly reviewerId: unknown;
  readonly decision: unknown;
  readonly reviewNote: unknown;
  readonly reviewedAt: unknown;
  constructor(targetType: unknown, submissionId: unknown, reviewerId: unknown, decision: unknown, reviewNote: unknown, reviewedAt: unknown) {
    super();
    this.targetType = targetType;
    this.submissionId = submissionId;
    this.reviewerId = reviewerId;
    this.decision = decision;
    this.reviewNote = reviewNote;
    this.reviewedAt = reviewedAt;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
