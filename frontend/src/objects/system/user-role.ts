import { z } from "zod";

export const UserRoleSchema = z.enum(["player", "designer", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;
