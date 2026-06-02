import { z } from "zod";
import { SubmissionStatusSchema } from "../system/submission-status.js";

export const ReviewedSubmissionSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  submitterId: z.string().min(1),
  status: SubmissionStatusSchema,
  reviewerId: z.string().min(1).optional(),
  reviewNote: z.string().max(1000).optional(),
  submittedAt: z.string(),
  reviewedAt: z.string().optional(),
});

export type ReviewedSubmission = z.infer<typeof ReviewedSubmissionSchema>;
