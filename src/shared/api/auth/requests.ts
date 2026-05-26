import { z } from "zod";
import { BindBackendUserInputSchema } from "../../schemas/user.js";

export const BindBackendUserRequestBodySchema = BindBackendUserInputSchema;

export type BindBackendUserRequestBody = z.infer<typeof BindBackendUserRequestBodySchema>;
