import { z } from "zod";
import { SubmissionStatusSchema } from "../system/system-objects.js";
import { LevelSchema } from "./level.js";

export const SubmissionSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  submitterId: z.string().min(1),
  status: SubmissionStatusSchema,
  reviewerId: z.string().min(1).optional(),
  reviewNote: z.string().max(1000).optional(),
  submittedAt: z.string(),
  reviewedAt: z.string().optional(),
});

export type Submission = z.infer<typeof SubmissionSchema>;

export const SubmissionWithLevelSchema = SubmissionSchema.extend({
  level: LevelSchema,
});

export type SubmissionWithLevel = z.infer<typeof SubmissionWithLevelSchema>;
