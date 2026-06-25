import { z } from "zod";
import { APIMessage } from "../../../../../system/api/APIMessage.js";

/** Mirrors backend internal API level/api/internal/admin/assignment/AssignSlotInternalApi.scala; not registered as a public frontend route. */
export class AssignSlotInternalAPI extends APIMessage<unknown> {
  readonly levelSuffix: unknown;
  readonly submissionId: unknown;
  readonly assignedById: unknown;
  readonly note: unknown;
  readonly birdPool: unknown;
  constructor(levelSuffix: unknown, submissionId: unknown, assignedById: unknown, note: unknown, birdPool: unknown) {
    super();
    this.levelSuffix = levelSuffix;
    this.submissionId = submissionId;
    this.assignedById = assignedById;
    this.note = note;
    this.birdPool = birdPool;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
