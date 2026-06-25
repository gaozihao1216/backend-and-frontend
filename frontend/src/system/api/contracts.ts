import { z } from "zod";
import { ErrorBodySchema, createApiSuccessSchema } from "../../objects/system/system-objects.js";

export const ApiErrorSchema = ErrorBodySchema;

export const createSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  createApiSuccessSchema(dataSchema);
