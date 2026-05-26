import { z } from "zod";
import { createSuccessResponseSchema } from "../../schemas/api.js";
import { LevelSchema } from "../../schemas/level.js";
import { SubmissionSchema } from "../../schemas/submission.js";

export const CreateLevelResponseDataSchema = LevelSchema;
export const CreateLevelResponseSchema = createSuccessResponseSchema(CreateLevelResponseDataSchema);

export const SubmitLevelResponseDataSchema = SubmissionSchema;
export const SubmitLevelResponseSchema = createSuccessResponseSchema(
  SubmitLevelResponseDataSchema,
);

export type CreateLevelResponseData = z.infer<typeof CreateLevelResponseDataSchema>;
export type CreateLevelResponse = z.infer<typeof CreateLevelResponseSchema>;
export type SubmitLevelResponseData = z.infer<typeof SubmitLevelResponseDataSchema>;
export type SubmitLevelResponse = z.infer<typeof SubmitLevelResponseSchema>;
