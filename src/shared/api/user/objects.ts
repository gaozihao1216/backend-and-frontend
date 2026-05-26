import { z } from "zod";
import { UserProfileSchema, UserSchema } from "../../schemas/user.js";

export const UserObjectSchema = UserSchema;
export const UserProfileObjectSchema = UserProfileSchema;

export const ApiUserSchema = UserObjectSchema;
export const ApiUserProfileSchema = UserProfileObjectSchema;

export type UserObject = z.infer<typeof UserObjectSchema>;
export type UserProfileObject = z.infer<typeof UserProfileObjectSchema>;
export type ApiUser = z.infer<typeof ApiUserSchema>;
export type ApiUserProfile = z.infer<typeof ApiUserProfileSchema>;
