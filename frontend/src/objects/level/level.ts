import { z } from "zod";
import { LevelStatusSchema, LevelTagSchema } from "../system/system-objects.js";
import { nullishToUndefined } from "../system/schema-utils.js";
import { LevelDataSchema } from "./level-data.js";

export const LevelSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().max(1000),
  tags: z.array(LevelTagSchema).max(5),
  data: LevelDataSchema,
  authorId: z.string().min(1),
  status: LevelStatusSchema,
  rejectionReason: nullishToUndefined(z.string().max(1000)),
  averageRating: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: nullishToUndefined(z.string()),
});

export type Level = z.infer<typeof LevelSchema>;
