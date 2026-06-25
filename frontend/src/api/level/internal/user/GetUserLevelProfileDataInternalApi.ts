import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API level/api/internal/user/GetUserLevelProfileDataInternalApi.scala; not registered as a public frontend route. */
export class GetUserLevelProfileDataInternalAPI extends APIMessage<unknown> {
  readonly userId: unknown;
  constructor(userId: unknown) {
    super();
    this.userId = userId;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
