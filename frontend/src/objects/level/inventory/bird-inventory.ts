import { z } from "zod";

export const BirdInventorySchema = z
  .object({
    basic: z.number().int().nonnegative(),
  })
  .catchall(z.number().int().nonnegative());

export type BirdInventory = z.infer<typeof BirdInventorySchema>;
