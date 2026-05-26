import { z } from "zod";
import { UserProfileSchema, UserSchema } from "../../schemas/user.js";

export const ApiUserSchema = UserSchema;
export const ApiUserProfileSchema = UserProfileSchema;

export type ApiUser = z.infer<typeof ApiUserSchema>;
export type ApiUserProfile = z.infer<typeof ApiUserProfileSchema>;
