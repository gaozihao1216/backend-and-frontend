import { z } from "zod";
import { UserIdParamsSchema } from "../../schemas/user.js";

export const GetUserProfileRequestQuerySchema = z.object({});
export const GetUserProfileRequestParamsSchema = UserIdParamsSchema;

export type GetUserProfileRequestQuery = z.infer<typeof GetUserProfileRequestQuerySchema>;
export type GetUserProfileRequestParams = z.infer<typeof GetUserProfileRequestParamsSchema>;
