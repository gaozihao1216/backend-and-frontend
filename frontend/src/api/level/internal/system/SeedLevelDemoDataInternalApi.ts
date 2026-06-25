import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API level/api/internal/system/SeedLevelDemoDataInternalApi.scala; not registered as a public frontend route. */
export class SeedLevelDemoDataInternalAPI extends APIMessage<unknown> {
  readonly createdAt: unknown;
  readonly reviewedAt: unknown;
  constructor(createdAt: unknown, reviewedAt: unknown) {
    super();
    this.createdAt = createdAt;
    this.reviewedAt = reviewedAt;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
