import { z } from "zod";
import { createSuccessResponseSchema } from "../../schemas/api.js";
import { CommentSchema } from "../../schemas/comment.js";
import { FavoriteSchema, FavoriteWithLevelSchema } from "../../schemas/favorite.js";
import { LevelSchema } from "../../schemas/level.js";
import { RatingSchema } from "../../schemas/rating.js";

export const GetPublishedLevelsResponseDataSchema = z.array(LevelSchema);
export const GetPublishedLevelsResponseSchema = createSuccessResponseSchema(
  GetPublishedLevelsResponseDataSchema,
);

export const GetPublishedLevelResponseDataSchema = LevelSchema;
export const GetPublishedLevelResponseSchema = createSuccessResponseSchema(
  GetPublishedLevelResponseDataSchema,
);

export const GetLevelCommentsResponseDataSchema = z.array(CommentSchema);
export const GetLevelCommentsResponseSchema = createSuccessResponseSchema(
  GetLevelCommentsResponseDataSchema,
);

export const CreateCommentResponseDataSchema = CommentSchema;
export const CreateCommentResponseSchema = createSuccessResponseSchema(
  CreateCommentResponseDataSchema,
);

export const GetFavoriteLevelsResponseDataSchema = z.array(FavoriteWithLevelSchema);
export const GetFavoriteLevelsResponseSchema = createSuccessResponseSchema(
  GetFavoriteLevelsResponseDataSchema,
);

export const FavoriteLevelResponseDataSchema = FavoriteSchema;
export const FavoriteLevelResponseSchema = createSuccessResponseSchema(
  FavoriteLevelResponseDataSchema,
);

export const UnfavoriteLevelResponseDataSchema = FavoriteSchema;
export const UnfavoriteLevelResponseSchema = createSuccessResponseSchema(
  UnfavoriteLevelResponseDataSchema,
);

export const RateLevelResponseDataSchema = RatingSchema;
export const RateLevelResponseSchema = createSuccessResponseSchema(RateLevelResponseDataSchema);

export type GetPublishedLevelsResponseData = z.infer<typeof GetPublishedLevelsResponseDataSchema>;
export type GetPublishedLevelResponseData = z.infer<typeof GetPublishedLevelResponseDataSchema>;
export type GetLevelCommentsResponseData = z.infer<typeof GetLevelCommentsResponseDataSchema>;
export type CreateCommentResponseData = z.infer<typeof CreateCommentResponseDataSchema>;
export type GetFavoriteLevelsResponseData = z.infer<typeof GetFavoriteLevelsResponseDataSchema>;
export type FavoriteLevelResponseData = z.infer<typeof FavoriteLevelResponseDataSchema>;
export type UnfavoriteLevelResponseData = z.infer<typeof UnfavoriteLevelResponseDataSchema>;
export type RateLevelResponseData = z.infer<typeof RateLevelResponseDataSchema>;
