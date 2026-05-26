import { z } from "zod";
import { CreateLevelInputSchema, SubmitLevelInputSchema } from "../../schemas/level.js";

export const CreateLevelRequestBodySchema = CreateLevelInputSchema;
export const SubmitLevelRequestBodySchema = SubmitLevelInputSchema;

export type CreateLevelRequestBody = z.infer<typeof CreateLevelRequestBodySchema>;
export type SubmitLevelRequestBody = z.infer<typeof SubmitLevelRequestBodySchema>;
