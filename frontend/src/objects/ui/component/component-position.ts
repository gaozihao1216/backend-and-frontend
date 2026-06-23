import { z } from "zod";

export const ComponentPositionUnitSchema = z.enum(["percent", "px"]);
export type ComponentPositionUnit = z.infer<typeof ComponentPositionUnitSchema>;

export const ComponentPositionSchema = z.object({
  unit: ComponentPositionUnitSchema.default("percent"),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
});
export type ComponentPosition = z.infer<typeof ComponentPositionSchema>;
