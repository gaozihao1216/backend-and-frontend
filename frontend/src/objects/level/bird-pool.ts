import { z } from "zod";

export const BirdPoolSchema = z.object({
  totalBirds: z.number().int().positive(),
  allowedBirdTypes: z.array(z.string().min(1)).default([]),
  caps: z.record(z.string(), z.number().int().nonnegative()).default({}),
});

export type BirdPool = z.infer<typeof BirdPoolSchema>;

export const DEFAULT_BIRD_POOL: BirdPool = {
  totalBirds: 3,
  allowedBirdTypes: [],
  caps: {},
};
