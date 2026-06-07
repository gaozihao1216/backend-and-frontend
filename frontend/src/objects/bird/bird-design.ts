import { z } from "zod";
import { LevelStatusSchema } from "../system/level-status.js";
import { nullishToUndefined } from "../system/schema-utils.js";

export const BirdDesignSchema = z.object({
  id: z.string().min(1),
  authorId: z.string().min(1),
  name: z.string().min(1),
  summary: z.string(),
  skillName: z.string().min(1),
  attack: z.number().int(),
  impact: z.number().int(),
  speed: z.number().int(),
  tierSkills: z.array(z.string()),
  previewImageUrl: z.string(),
  mechanismTags: z.array(z.string()),
  status: LevelStatusSchema,
  rejectionReason: nullishToUndefined(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: nullishToUndefined(z.string()),
});

export type BirdDesign = z.infer<typeof BirdDesignSchema>;

export const BirdDesignInputSchema = z.object({
  name: z.string().trim().min(2),
  summary: z.string().trim().min(6),
  skillName: z.string().trim().min(2),
  attack: z.number().int().min(1).max(200),
  impact: z.number().int().min(1).max(200),
  speed: z.number().int().min(1).max(200),
  tierSkills: z.array(z.string().trim().min(1)).length(3),
  previewImageUrl: z.string().optional(),
  mechanismTags: z.array(z.string().trim().min(1)).default([]),
});

export type BirdDesignInput = z.infer<typeof BirdDesignInputSchema>;
