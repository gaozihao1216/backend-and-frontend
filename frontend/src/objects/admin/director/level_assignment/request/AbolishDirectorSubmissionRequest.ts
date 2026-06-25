import { z } from "zod";

export const AbolishDirectorSubmissionRequestBodySchema = z.object({
  note: z.string().max(1000).optional(),
});

export type AbolishDirectorSubmissionRequestBody = z.infer<typeof AbolishDirectorSubmissionRequestBodySchema>;
