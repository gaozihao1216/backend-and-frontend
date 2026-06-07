import { z } from "zod";
import { SubmissionStatusSchema } from "../system/submission-status.js";
import { nullishToUndefined } from "../system/schema-utils.js";
import { BirdDesignSchema } from "./bird-design.js";

export const BirdSubmissionSchema = z.object({
  id: z.string().min(1),
  birdDesignId: z.string().min(1),
  submitterId: z.string().min(1),
  status: SubmissionStatusSchema,
  reviewerId: nullishToUndefined(z.string().min(1)),
  reviewNote: nullishToUndefined(z.string()),
  submittedAt: z.string(),
  reviewedAt: nullishToUndefined(z.string()),
});

export type BirdSubmission = z.infer<typeof BirdSubmissionSchema>;

export const BirdSubmissionWithDesignSchema = BirdSubmissionSchema.extend({
  design: BirdDesignSchema,
});

export type BirdSubmissionWithDesign = z.infer<typeof BirdSubmissionWithDesignSchema>;

export const ReviewedBirdSubmissionSchema = BirdSubmissionSchema;

export type ReviewedBirdSubmission = z.infer<typeof ReviewedBirdSubmissionSchema>;
