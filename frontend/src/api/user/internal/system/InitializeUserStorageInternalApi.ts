import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API user/api/internal/system/InitializeUserStorageInternalApi.scala; not registered as a public frontend route. */
export class InitializeUserStorageInternalAPI extends APIMessage<unknown> {

  constructor() {
    super();
  }

  override get responseSchema() {
    return z.unknown();
  }
}
