import { z } from "zod";

export const SubmissionStatusSchema = z.enum(["pending_review", "approved", "rejected", "abolished"]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;
