import { z } from "zod";

export const TransferDirectorPermissionRequestBodySchema = z.object({
  targetAdminId: z.string().min(1),
});

export type TransferDirectorPermissionRequestBody = z.infer<typeof TransferDirectorPermissionRequestBodySchema>;
