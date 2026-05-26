import { z } from "zod";
import { IdSchema, IsoDateTimeSchema } from "./common.js";
import { LevelSchema } from "./level.js";

// FavoriteWithLevel 用于前端收藏列表，避免前端再额外按 levelId 二次请求关卡详情。
export const FavoriteSchema = z.object({
  id: IdSchema,
  levelId: IdSchema,
  userId: IdSchema,
  createdAt: IsoDateTimeSchema,
});

export const FavoriteWithLevelSchema = FavoriteSchema.extend({
  level: LevelSchema,
});

export type Favorite = z.infer<typeof FavoriteSchema>;
export type FavoriteWithLevel = z.infer<typeof FavoriteWithLevelSchema>;
