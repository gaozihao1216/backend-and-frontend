import { z } from "zod";
import { PositionSchema } from "./position.js";

export const GroundLineSchema = z.object({
  type: z.literal("line"),
  points: z.array(PositionSchema).min(2),
});

export const GroundBezierSchema = z.object({
  type: z.literal("bezier"),
  controlPoints: z.array(PositionSchema).min(3),
});

export const LevelGroundSchema = z.discriminatedUnion("type", [GroundLineSchema, GroundBezierSchema]);
export type LevelGround = z.infer<typeof LevelGroundSchema>;
