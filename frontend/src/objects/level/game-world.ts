import { z } from "zod";

export const GameWorldSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  gravity: z.number().positive(),
});

export type GameWorld = z.infer<typeof GameWorldSchema>;
