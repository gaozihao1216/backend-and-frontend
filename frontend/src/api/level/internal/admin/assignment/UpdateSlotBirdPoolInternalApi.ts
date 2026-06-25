import { z } from "zod";
import { APIMessage } from "../../../../../system/api/APIMessage.js";

/** Mirrors backend internal API level/api/internal/admin/assignment/UpdateSlotBirdPoolInternalApi.scala; not registered as a public frontend route. */
export class UpdateSlotBirdPoolInternalAPI extends APIMessage<unknown> {
  readonly levelSuffix: unknown;
  readonly birdPool: unknown;
  constructor(levelSuffix: unknown, birdPool: unknown) {
    super();
    this.levelSuffix = levelSuffix;
    this.birdPool = birdPool;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
