import { z } from "zod";
import { SubmissionWithLevelSchema } from "../../../../level/submission/submission-with-level.js";
import { LevelSlotAssignmentDetailSchema } from "../assignment/level-slot-assignment.js";

export const BirdPoolOptionSchema = z.object({
  birdType: z.string().min(1),
  name: z.string().min(1),
  source: z.enum(["system", "designer"]),
  authorId: z.string().nullable().optional(),
});

export type BirdPoolOption = z.infer<typeof BirdPoolOptionSchema>;

export const DirectorLevelAssignmentBoardSchema = z.object({
  assignments: z.array(LevelSlotAssignmentDetailSchema),
  pendingApproved: z.array(SubmissionWithLevelSchema),
  birdPoolOptions: z.array(BirdPoolOptionSchema).default([]),
});

export type DirectorLevelAssignmentBoard = z.infer<typeof DirectorLevelAssignmentBoardSchema>;
