import { z } from "zod";

export const SizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export type Size = z.infer<typeof SizeSchema>;
