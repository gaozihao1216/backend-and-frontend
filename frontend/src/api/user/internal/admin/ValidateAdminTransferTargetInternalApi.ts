import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API user/api/internal/admin/ValidateAdminTransferTargetInternalApi.scala; not registered as a public frontend route. */
export class ValidateAdminTransferTargetInternalAPI extends APIMessage<unknown> {
  readonly targetAdminId: unknown;
  constructor(targetAdminId: unknown) {
    super();
    this.targetAdminId = targetAdminId;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
