import { z } from "zod";
import { PositionSchema } from "./position.js";

export const GroundBezierSchema = z.object({
  type: z.literal("bezier"),
  controlPoints: z.array(PositionSchema).min(3),
});

export type GroundBezier = z.infer<typeof GroundBezierSchema>;
