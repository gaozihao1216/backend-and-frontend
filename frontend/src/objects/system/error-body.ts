import { z } from "zod";
import { nullishToUndefined } from "./schema-utils.js";

export const ErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  details: nullishToUndefined(z.string()),
});

export type ErrorBody = z.infer<typeof ErrorBodySchema>;
