import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API bird/api/internal/director/GetDirectorBirdSkillInternalApi.scala; not registered as a public frontend route. */
export class GetDirectorBirdSkillInternalAPI extends APIMessage<unknown> {
  readonly birdType: unknown;
  constructor(birdType: unknown) {
    super();
    this.birdType = birdType;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
