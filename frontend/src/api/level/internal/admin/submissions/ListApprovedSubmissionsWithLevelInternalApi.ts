import { z } from "zod";
import { APIMessage } from "../../../../../system/api/APIMessage.js";

/** Mirrors backend internal API level/api/internal/admin/submissions/ListApprovedSubmissionsWithLevelInternalApi.scala; not registered as a public frontend route. */
export class ListApprovedSubmissionsWithLevelInternalAPI extends APIMessage<unknown> {
  readonly excludeSubmissionIds: unknown;
  constructor(excludeSubmissionIds: unknown) {
    super();
    this.excludeSubmissionIds = excludeSubmissionIds;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
