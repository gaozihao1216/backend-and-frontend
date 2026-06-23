import { z } from "zod";

export const SubmitLevelRequestBodySchema = z.object({
  levelId: z.string().min(1),
});

export type SubmitLevelRequestBody = z.infer<typeof SubmitLevelRequestBodySchema>;
