import { z } from "zod";
import { nullishToUndefined } from "../../../../system/schema-utils.js";
import { BirdPoolSchema } from "../../../../level/inventory/bird-pool.js";
import { SubmissionWithLevelSchema } from "../../../../level/submission/submission-with-level.js";

export const LevelSlotAssignmentSchema = z.object({
  id: z.string().min(1),
  levelSuffix: z.string().min(1),
  submissionId: z.string().min(1),
  sourceLevelId: z.string().min(1),
  assignedById: z.string().min(1),
  assignedAt: z.string(),
  note: nullishToUndefined(z.string().max(1000)),
  birdPool: nullishToUndefined(BirdPoolSchema),
});

export type LevelSlotAssignment = z.infer<typeof LevelSlotAssignmentSchema>;

export const LevelSlotAssignmentDetailSchema = z.object({
  assignment: LevelSlotAssignmentSchema,
  submission: SubmissionWithLevelSchema,
});

export type LevelSlotAssignmentDetail = z.infer<typeof LevelSlotAssignmentDetailSchema>;

