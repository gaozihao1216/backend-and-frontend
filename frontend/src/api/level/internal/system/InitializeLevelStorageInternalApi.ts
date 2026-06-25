import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API level/api/internal/system/InitializeLevelStorageInternalApi.scala; not registered as a public frontend route. */
export class InitializeLevelStorageInternalAPI extends APIMessage<unknown> {

  constructor() {
    super();
  }

  override get responseSchema() {
    return z.unknown();
  }
}
