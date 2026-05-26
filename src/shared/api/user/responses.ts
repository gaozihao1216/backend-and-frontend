import { z } from "zod";
import { createSuccessResponseSchema } from "../../schemas/api.js";
import { UserProfileSchema } from "../../schemas/user.js";

export const GetUserProfileResponseDataSchema = UserProfileSchema;
export const GetUserProfileResponseSchema = createSuccessResponseSchema(
  GetUserProfileResponseDataSchema,
);

export type GetUserProfileResponseData = z.infer<typeof GetUserProfileResponseDataSchema>;
export type GetUserProfileResponse = z.infer<typeof GetUserProfileResponseSchema>;
