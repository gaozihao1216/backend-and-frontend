import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API bird/api/internal/director/SaveDirectorBirdSkillInternalApi.scala; not registered as a public frontend route. */
export class SaveDirectorBirdSkillInternalAPI extends APIMessage<unknown> {
  readonly userId: unknown;
  readonly birdType: unknown;
  readonly skills: unknown;
  readonly modelImageUrl: unknown;
  constructor(userId: unknown, birdType: unknown, skills: unknown, modelImageUrl: unknown) {
    super();
    this.userId = userId;
    this.birdType = birdType;
    this.skills = skills;
    this.modelImageUrl = modelImageUrl;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
