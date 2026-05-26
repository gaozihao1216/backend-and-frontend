import { z } from "zod";
import { UserIdParamsSchema } from "../../schemas/user.js";

export const GetUserProfileRequestParamsSchema = UserIdParamsSchema;

export type GetUserProfileRequestParams = z.infer<typeof GetUserProfileRequestParamsSchema>;
