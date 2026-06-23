import { z } from "zod";
import { BirdPoolSchema } from "../../../../../objects/level/inventory/bird-pool.js";
import { nullishToUndefined } from "../../../../../objects/system/schema-utils.js";

export const AssignLevelSlotRequestBodySchema = z.object({
  submissionId: z.string().min(1),
  note: z.string().max(1000).optional(),
  birdPool: nullishToUndefined(BirdPoolSchema),
});

export type AssignLevelSlotRequestBody = z.infer<typeof AssignLevelSlotRequestBodySchema>;
