import { z } from "zod";
import { CreateCommentInputSchema } from "../../schemas/comment.js";
import { LevelIdParamsSchema, PublishedLevelsQuerySchema } from "../../schemas/level.js";
import { CreateRatingInputSchema } from "../../schemas/rating.js";

export const GetPublishedLevelsRequestQuerySchema = PublishedLevelsQuerySchema;
export const GetPublishedLevelRequestParamsSchema = LevelIdParamsSchema;
export const GetLevelCommentsRequestParamsSchema = LevelIdParamsSchema;
export const CreateCommentRequestParamsSchema = LevelIdParamsSchema;
export const CreateCommentRequestBodySchema = CreateCommentInputSchema;
export const FavoriteLevelRequestParamsSchema = LevelIdParamsSchema;
export const UnfavoriteLevelRequestParamsSchema = LevelIdParamsSchema;
export const RateLevelRequestParamsSchema = LevelIdParamsSchema;
export const RateLevelRequestBodySchema = CreateRatingInputSchema;

export type GetPublishedLevelsRequestQuery = z.infer<typeof GetPublishedLevelsRequestQuerySchema>;
export type GetPublishedLevelRequestParams = z.infer<typeof GetPublishedLevelRequestParamsSchema>;
export type GetLevelCommentsRequestParams = z.infer<typeof GetLevelCommentsRequestParamsSchema>;
export type CreateCommentRequestParams = z.infer<typeof CreateCommentRequestParamsSchema>;
export type CreateCommentRequestBody = z.infer<typeof CreateCommentRequestBodySchema>;
export type FavoriteLevelRequestParams = z.infer<typeof FavoriteLevelRequestParamsSchema>;
export type UnfavoriteLevelRequestParams = z.infer<typeof UnfavoriteLevelRequestParamsSchema>;
export type RateLevelRequestParams = z.infer<typeof RateLevelRequestParamsSchema>;
export type RateLevelRequestBody = z.infer<typeof RateLevelRequestBodySchema>;
