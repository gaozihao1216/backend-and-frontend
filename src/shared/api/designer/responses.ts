import { z } from "zod";
import { createSuccessResponseSchema } from "../../schemas/api.js";
import { DesignerLevelSchema, DesignerSubmissionSchema } from "./objects.js";

export const CreateLevelResponseDataSchema = DesignerLevelSchema;
export const CreateLevelResponseSchema = createSuccessResponseSchema(CreateLevelResponseDataSchema);

export const SubmitLevelResponseDataSchema = DesignerSubmissionSchema;
export const SubmitLevelResponseSchema = createSuccessResponseSchema(
  SubmitLevelResponseDataSchema,
);

export type CreateLevelResponseData = z.infer<typeof CreateLevelResponseDataSchema>;
export type CreateLevelResponse = z.infer<typeof CreateLevelResponseSchema>;
export type SubmitLevelResponseData = z.infer<typeof SubmitLevelResponseDataSchema>;
export type SubmitLevelResponse = z.infer<typeof SubmitLevelResponseSchema>;
