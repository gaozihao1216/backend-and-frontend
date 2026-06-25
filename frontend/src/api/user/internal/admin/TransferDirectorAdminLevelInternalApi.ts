import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API user/api/internal/admin/TransferDirectorAdminLevelInternalApi.scala; not registered as a public frontend route. */
export class TransferDirectorAdminLevelInternalAPI extends APIMessage<unknown> {
  readonly currentDirectorId: unknown;
  readonly targetAdminId: unknown;
  constructor(currentDirectorId: unknown, targetAdminId: unknown) {
    super();
    this.currentDirectorId = currentDirectorId;
    this.targetAdminId = targetAdminId;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
