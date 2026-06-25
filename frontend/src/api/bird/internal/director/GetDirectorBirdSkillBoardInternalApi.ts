import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API bird/api/internal/director/GetDirectorBirdSkillBoardInternalApi.scala; not registered as a public frontend route. */
export class GetDirectorBirdSkillBoardInternalAPI extends APIMessage<unknown> {

  constructor() {
    super();
  }

  override get responseSchema() {
    return z.unknown();
  }
}
