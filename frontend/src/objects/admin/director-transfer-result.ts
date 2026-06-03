import { z } from "zod";

export const DirectorTransferResultSchema = z.object({
  previousDirectorId: z.string().min(1),
  newDirectorId: z.string().min(1),
});

export type DirectorTransferResult = z.infer<typeof DirectorTransferResultSchema>;
