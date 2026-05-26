import { z } from "zod";
import { BindBackendUserInputSchema } from "../../schemas/user.js";

export const GetBackendUsersRequestQuerySchema = z.object({});
export const BindBackendUserRequestBodySchema = BindBackendUserInputSchema;

export type GetBackendUsersRequestQuery = z.infer<typeof GetBackendUsersRequestQuerySchema>;
export type BindBackendUserRequestBody = z.infer<typeof BindBackendUserRequestBodySchema>;
