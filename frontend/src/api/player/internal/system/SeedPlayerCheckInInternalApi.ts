import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API player/api/internal/system/SeedPlayerCheckInInternalApi.scala; not registered as a public frontend route. */
export class SeedPlayerCheckInInternalAPI extends APIMessage<unknown> {

  constructor() {
    super();
  }

  override get responseSchema() {
    return z.unknown();
  }
}
