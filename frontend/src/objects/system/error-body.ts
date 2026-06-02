import { z } from "zod";

export const ErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.string().optional(),
});

export type ErrorBody = z.infer<typeof ErrorBodySchema>;
