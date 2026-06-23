import { z } from "zod";
import { SubmissionStatusSchema } from "../../system/system-objects.js";
import { nullishToUndefined } from "../../system/schema-utils.js";

export const SubmissionSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  submitterId: z.string().min(1),
  status: SubmissionStatusSchema,
  reviewerId: nullishToUndefined(z.string().min(1)),
  reviewNote: nullishToUndefined(z.string().max(1000)),
  submittedAt: z.string(),
  reviewedAt: nullishToUndefined(z.string()),
});

export type Submission = z.infer<typeof SubmissionSchema>;
