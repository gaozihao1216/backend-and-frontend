import { z } from "zod";
import { AdminLevelSchema } from "../../../system/system-objects.js";

export const DirectorPermissionSummarySchema = z.object({
  userId: z.string().min(1),
  adminLevel: AdminLevelSchema,
  canManageUiCustomization: z.boolean(),
});

export type DirectorPermissionSummary = z.infer<typeof DirectorPermissionSummarySchema>;
