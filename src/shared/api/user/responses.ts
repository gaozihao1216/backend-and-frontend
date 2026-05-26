import { z } from "zod";
import { createSuccessResponseSchema } from "../../schemas/api.js";
import { UserProfileObjectSchema } from "./objects.js";

export const GetUserProfileResponseDataSchema = UserProfileObjectSchema;
export const GetUserProfileResponseSchema = createSuccessResponseSchema(
  GetUserProfileResponseDataSchema,
);

export type GetUserProfileResponseData = z.infer<typeof GetUserProfileResponseDataSchema>;
export type GetUserProfileResponse = z.infer<typeof GetUserProfileResponseSchema>;
