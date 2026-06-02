import { z } from "zod";
import { PositionSchema } from "./position.js";

export const GroundLineSchema = z.object({
  type: z.literal("line"),
  points: z.array(PositionSchema).min(2),
});

export type GroundLine = z.infer<typeof GroundLineSchema>;
