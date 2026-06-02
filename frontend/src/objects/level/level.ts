import { z } from "zod";
import { LevelStatusSchema, LevelTagSchema } from "../system/system-objects.js";
import { LevelDataSchema } from "./level-data.js";

export const LevelSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().max(1000),
  tags: z.array(LevelTagSchema).max(5),
  data: LevelDataSchema,
  authorId: z.string().min(1),
  status: LevelStatusSchema,
  rejectionReason: z.string().max(1000).optional(),
  averageRating: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
});

export type Level = z.infer<typeof LevelSchema>;
