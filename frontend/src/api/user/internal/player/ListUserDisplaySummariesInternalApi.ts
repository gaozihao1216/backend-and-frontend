import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API user/api/internal/player/ListUserDisplaySummariesInternalApi.scala; not registered as a public frontend route. */
export class ListUserDisplaySummariesInternalAPI extends APIMessage<unknown> {
  readonly userIds: unknown;
  constructor(userIds: unknown) {
    super();
    this.userIds = userIds;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
