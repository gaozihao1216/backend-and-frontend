import { z } from "zod";
import {
  IdSchema,
  IsoDateTimeSchema,
  SubmissionStatusSchema,
} from "./common.js";

export const SubmissionSchema = z.object({
  id: IdSchema,
  levelId: IdSchema,
  submitterId: IdSchema,
  status: SubmissionStatusSchema,
  reviewerId: IdSchema.optional(),
  reviewNote: z.string().max(1000).optional(),
  submittedAt: IsoDateTimeSchema,
  reviewedAt: IsoDateTimeSchema.optional(),
});

export const SubmissionIdParamsSchema = z.object({
  submissionId: IdSchema,
});

export const ReviewSubmissionInputSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(1000).optional(),
});

export type Submission = z.infer<typeof SubmissionSchema>;
export type SubmissionIdParams = z.infer<typeof SubmissionIdParamsSchema>;
export type ReviewSubmissionInput = z.infer<typeof ReviewSubmissionInputSchema>;
