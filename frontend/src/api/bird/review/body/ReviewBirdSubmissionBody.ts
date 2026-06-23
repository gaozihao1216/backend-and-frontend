import { z } from "zod";

export const ReviewBirdSubmissionRequestBodySchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(1000).optional(),
});

export type ReviewBirdSubmissionRequestBody = z.infer<typeof ReviewBirdSubmissionRequestBodySchema>;
