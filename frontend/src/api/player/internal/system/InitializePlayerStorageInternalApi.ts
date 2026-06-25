import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API player/api/internal/system/InitializePlayerStorageInternalApi.scala; not registered as a public frontend route. */
export class InitializePlayerStorageInternalAPI extends APIMessage<unknown> {
  readonly systemBirdTypes: unknown;
  constructor(systemBirdTypes: unknown) {
    super();
    this.systemBirdTypes = systemBirdTypes;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
