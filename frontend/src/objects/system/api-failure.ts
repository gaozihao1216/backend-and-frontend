import { z } from "zod";
import { ErrorBodySchema } from "./error-body.js";

export const ApiFailureSchema = z.object({
  success: z.literal(false),
  error: ErrorBodySchema,
});

export type ApiFailure = z.infer<typeof ApiFailureSchema>;
