import { z } from "zod";
import { nullishToUndefined } from "../system/schema-utils.js";
import { SubmissionWithLevelSchema } from "../level/submission-with-level.js";

export const LevelSlotAssignmentSchema = z.object({
  id: z.string().min(1),
  levelSuffix: z.string().min(1),
  submissionId: z.string().min(1),
  sourceLevelId: z.string().min(1),
  assignedById: z.string().min(1),
  assignedAt: z.string(),
  note: nullishToUndefined(z.string().max(1000)),
});

export type LevelSlotAssignment = z.infer<typeof LevelSlotAssignmentSchema>;

export const LevelSlotAssignmentDetailSchema = z.object({
  assignment: LevelSlotAssignmentSchema,
  submission: SubmissionWithLevelSchema,
});

export type LevelSlotAssignmentDetail = z.infer<typeof LevelSlotAssignmentDetailSchema>;

export const DirectorLevelAssignmentBoardSchema = z.object({
  assignments: z.array(LevelSlotAssignmentDetailSchema),
  pendingApproved: z.array(SubmissionWithLevelSchema),
});

export type DirectorLevelAssignmentBoard = z.infer<typeof DirectorLevelAssignmentBoardSchema>;

export const AssignLevelSlotRequestBodySchema = z.object({
  submissionId: z.string().min(1),
  note: z.string().max(1000).optional(),
});

export type AssignLevelSlotRequestBody = z.infer<typeof AssignLevelSlotRequestBodySchema>;

export const AbolishDirectorSubmissionRequestBodySchema = z.object({
  note: z.string().max(1000).optional(),
});

export type AbolishDirectorSubmissionRequestBody = z.infer<typeof AbolishDirectorSubmissionRequestBodySchema>;
