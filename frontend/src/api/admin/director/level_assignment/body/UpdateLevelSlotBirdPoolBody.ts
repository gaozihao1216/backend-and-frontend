import { z } from "zod";
import { BirdPoolSchema } from "../../../../../objects/level/inventory/bird-pool.js";

export const UpdateLevelSlotBirdPoolRequestBodySchema = z.object({
  birdPool: BirdPoolSchema,
});

export type UpdateLevelSlotBirdPoolRequestBody = z.infer<typeof UpdateLevelSlotBirdPoolRequestBodySchema>;
