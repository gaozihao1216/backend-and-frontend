import { z } from "zod";
import { APIMessage } from "../../../../../system/api/APIMessage.js";

/** Mirrors backend internal API level/api/internal/admin/assignment/UnassignSlotInternalApi.scala; not registered as a public frontend route. */
export class UnassignSlotInternalAPI extends APIMessage<unknown> {
  readonly levelSuffix: unknown;
  constructor(levelSuffix: unknown) {
    super();
    this.levelSuffix = levelSuffix;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
