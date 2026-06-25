import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API user/api/internal/player/UserExistsInternalApi.scala; not registered as a public frontend route. */
export class UserExistsInternalAPI extends APIMessage<unknown> {
  readonly userId: unknown;
  constructor(userId: unknown) {
    super();
    this.userId = userId;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
