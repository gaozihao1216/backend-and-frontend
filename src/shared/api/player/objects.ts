import { z } from "zod";
import { CommentSchema } from "../../schemas/comment.js";
import { FavoriteSchema, FavoriteWithLevelSchema } from "../../schemas/favorite.js";
import { LevelSchema } from "../../schemas/level.js";
import { RatingSchema } from "../../schemas/rating.js";

export const PublishedLevelSchema = LevelSchema;
export const LevelCommentSchema = CommentSchema;
export const PlayerFavoriteSchema = FavoriteSchema;
export const PlayerFavoriteWithLevelSchema = FavoriteWithLevelSchema;
export const LevelRatingSchema = RatingSchema;

export type PublishedLevel = z.infer<typeof PublishedLevelSchema>;
export type LevelComment = z.infer<typeof LevelCommentSchema>;
export type PlayerFavorite = z.infer<typeof PlayerFavoriteSchema>;
export type PlayerFavoriteWithLevel = z.infer<typeof PlayerFavoriteWithLevelSchema>;
export type LevelRating = z.infer<typeof LevelRatingSchema>;
