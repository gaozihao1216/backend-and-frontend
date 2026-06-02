import { z } from "zod";
import { UserRoleSchema } from "../system/system-objects.js";

export const BackendUserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(3).max(32),
  displayName: z.string().min(1).max(50),
  role: UserRoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BackendUser = z.infer<typeof BackendUserSchema>;
