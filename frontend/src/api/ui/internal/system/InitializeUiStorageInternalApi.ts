import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API ui/api/internal/system/InitializeUiStorageInternalApi.scala; not registered as a public frontend route. */
export class InitializeUiStorageInternalAPI extends APIMessage<unknown> {

  constructor() {
    super();
  }

  override get responseSchema() {
    return z.unknown();
  }
}
