import { z } from "zod";
import { UserSchema } from "../../schemas/user.js";

export const BoundBackendUserSchema = UserSchema;

export type BoundBackendUser = z.infer<typeof BoundBackendUserSchema>;
