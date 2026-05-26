import { z } from "zod";
import { createSuccessResponseSchema } from "../../schemas/api.js";
import { BoundBackendUserSchema } from "./objects.js";

export const GetBackendUsersResponseDataSchema = z.array(BoundBackendUserSchema);
export const GetBackendUsersResponseSchema = createSuccessResponseSchema(
  GetBackendUsersResponseDataSchema,
);

export const BindBackendUserResponseDataSchema = BoundBackendUserSchema;
export const BindBackendUserResponseSchema = createSuccessResponseSchema(
  BindBackendUserResponseDataSchema,
);

export type GetBackendUsersResponseData = z.infer<typeof GetBackendUsersResponseDataSchema>;
export type GetBackendUsersResponse = z.infer<typeof GetBackendUsersResponseSchema>;
export type BindBackendUserResponseData = z.infer<typeof BindBackendUserResponseDataSchema>;
export type BindBackendUserResponse = z.infer<typeof BindBackendUserResponseSchema>;
