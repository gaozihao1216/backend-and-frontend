import { z } from "zod";
import { GroundBezierSchema } from "./ground-bezier.js";
import { GroundLineSchema } from "./ground-line.js";

export const LevelGroundSchema = z.discriminatedUnion("type", [GroundLineSchema, GroundBezierSchema]);
export type LevelGround = z.infer<typeof LevelGroundSchema>;
export type { GroundBezier } from "./ground-bezier.js";
export type { GroundLine } from "./ground-line.js";
