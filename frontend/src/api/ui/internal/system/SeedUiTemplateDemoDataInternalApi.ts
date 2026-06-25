import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API ui/api/internal/system/SeedUiTemplateDemoDataInternalApi.scala; not registered as a public frontend route. */
export class SeedUiTemplateDemoDataInternalAPI extends APIMessage<unknown> {
  readonly createdAt: unknown;
  constructor(createdAt: unknown) {
    super();
    this.createdAt = createdAt;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
