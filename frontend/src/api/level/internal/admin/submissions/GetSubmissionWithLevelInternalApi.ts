import { z } from "zod";
import { APIMessage } from "../../../../../system/api/APIMessage.js";

/** Mirrors backend internal API level/api/internal/admin/submissions/GetSubmissionWithLevelInternalApi.scala; not registered as a public frontend route. */
export class GetSubmissionWithLevelInternalAPI extends APIMessage<unknown> {
  readonly submissionId: unknown;
  constructor(submissionId: unknown) {
    super();
    this.submissionId = submissionId;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
