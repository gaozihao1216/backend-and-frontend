import { z } from "zod";
import { IdSchema, IsoDateTimeSchema } from "./common.js";

// 评分只允许 1~5 的整数，避免半星或浮点值引入额外展示/统计复杂度。
export const RatingValueSchema = z.number().int().min(1).max(5);

export const RatingSchema = z.object({
  id: IdSchema,
  levelId: IdSchema,
  playerId: IdSchema,
  score: RatingValueSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const CreateRatingInputSchema = z.object({
  score: RatingValueSchema,
});

export type RatingValue = z.infer<typeof RatingValueSchema>;
export type Rating = z.infer<typeof RatingSchema>;
export type CreateRatingInput = z.infer<typeof CreateRatingInputSchema>;
