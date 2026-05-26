import { z } from "zod";
import { createSuccessResponseSchema } from "../../schemas/api.js";
import {
  LevelCommentSchema,
  LevelRatingSchema,
  PlayerFavoriteSchema,
  PlayerFavoriteWithLevelSchema,
  PublishedLevelSchema,
} from "./objects.js";

export const GetPublishedLevelsResponseDataSchema = z.array(PublishedLevelSchema);
export const GetPublishedLevelsResponseSchema = createSuccessResponseSchema(
  GetPublishedLevelsResponseDataSchema,
);

export const GetPublishedLevelResponseDataSchema = PublishedLevelSchema;
export const GetPublishedLevelResponseSchema = createSuccessResponseSchema(
  GetPublishedLevelResponseDataSchema,
);

export const GetLevelCommentsResponseDataSchema = z.array(LevelCommentSchema);
export const GetLevelCommentsResponseSchema = createSuccessResponseSchema(
  GetLevelCommentsResponseDataSchema,
);

export const CreateCommentResponseDataSchema = LevelCommentSchema;
export const CreateCommentResponseSchema = createSuccessResponseSchema(
  CreateCommentResponseDataSchema,
);

export const GetFavoriteLevelsResponseDataSchema = z.array(PlayerFavoriteWithLevelSchema);
export const GetFavoriteLevelsResponseSchema = createSuccessResponseSchema(
  GetFavoriteLevelsResponseDataSchema,
);

export const FavoriteLevelResponseDataSchema = PlayerFavoriteSchema;
export const FavoriteLevelResponseSchema = createSuccessResponseSchema(
  FavoriteLevelResponseDataSchema,
);

export const UnfavoriteLevelResponseDataSchema = PlayerFavoriteSchema;
export const UnfavoriteLevelResponseSchema = createSuccessResponseSchema(
  UnfavoriteLevelResponseDataSchema,
);

export const RateLevelResponseDataSchema = LevelRatingSchema;
export const RateLevelResponseSchema = createSuccessResponseSchema(RateLevelResponseDataSchema);

export type GetPublishedLevelsResponseData = z.infer<typeof GetPublishedLevelsResponseDataSchema>;
export type GetPublishedLevelsResponse = z.infer<typeof GetPublishedLevelsResponseSchema>;
export type GetPublishedLevelResponseData = z.infer<typeof GetPublishedLevelResponseDataSchema>;
export type GetPublishedLevelResponse = z.infer<typeof GetPublishedLevelResponseSchema>;
export type GetLevelCommentsResponseData = z.infer<typeof GetLevelCommentsResponseDataSchema>;
export type GetLevelCommentsResponse = z.infer<typeof GetLevelCommentsResponseSchema>;
export type CreateCommentResponseData = z.infer<typeof CreateCommentResponseDataSchema>;
export type CreateCommentResponse = z.infer<typeof CreateCommentResponseSchema>;
export type GetFavoriteLevelsResponseData = z.infer<typeof GetFavoriteLevelsResponseDataSchema>;
export type GetFavoriteLevelsResponse = z.infer<typeof GetFavoriteLevelsResponseSchema>;
export type FavoriteLevelResponseData = z.infer<typeof FavoriteLevelResponseDataSchema>;
export type FavoriteLevelResponse = z.infer<typeof FavoriteLevelResponseSchema>;
export type UnfavoriteLevelResponseData = z.infer<typeof UnfavoriteLevelResponseDataSchema>;
export type UnfavoriteLevelResponse = z.infer<typeof UnfavoriteLevelResponseSchema>;
export type RateLevelResponseData = z.infer<typeof RateLevelResponseDataSchema>;
export type RateLevelResponse = z.infer<typeof RateLevelResponseSchema>;
