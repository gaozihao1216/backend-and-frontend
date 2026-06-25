import { z } from "zod";

export const RateLevelRequestBodySchema = z.object({
  score: z.number().int().min(1).max(5),
});

export type RateLevelRequestBody = z.infer<typeof RateLevelRequestBodySchema>;
