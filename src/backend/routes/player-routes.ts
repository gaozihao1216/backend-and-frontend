import { Router } from "express";
import {
  CommentSchema,
  CreateCommentInputSchema,
  CreateRatingInputSchema,
  FavoriteSchema,
  FavoriteWithLevelSchema,
  LevelIdParamsSchema,
  LevelSchema,
  PublishedLevelsQuerySchema,
  RatingSchema,
} from "../../shared/types.js";
import { getCurrentUser, parseOrThrow, success } from "../lib/http.js";
import { requireRole } from "../middleware/auth.js";
import { commentService } from "../services/comment-service.js";
import { favoriteService } from "../services/favorite-service.js";
import { levelService } from "../services/level-service.js";
import { ratingService } from "../services/rating-service.js";
import { HttpError } from "../lib/http.js";

export const playerRouter = Router();

playerRouter.use(requireRole("player"));

playerRouter.get("/levels", (req, res) => {
  // 玩家端关卡列表支持按标签和排序方式筛选。
  const query = parseOrThrow(PublishedLevelsQuerySchema, req.query);
  const options = {
    ...(query.tag ? { tag: query.tag } : {}),
    ...(query.sort ? { sort: query.sort } : {}),
  };
  const levels = levelService
    .getPublishedLevels(options)
    .map((level) => parseOrThrow(LevelSchema, level));
  res.json(success(levels));
});

playerRouter.get("/levels/:levelId", (req, res) => {
  const params = parseOrThrow(LevelIdParamsSchema, req.params);
  const level = levelService.getLevelById(params.levelId);
  if (level.status !== "published") {
    // 对玩家来说，未发布关卡应该表现得像不存在，而不是泄露其真实状态。
    throw new HttpError(404, "LEVEL_NOT_FOUND", "Published level not found");
  }
  res.json(success(parseOrThrow(LevelSchema, level)));
});

playerRouter.get("/levels/:levelId/comments", (req, res) => {
  const params = parseOrThrow(LevelIdParamsSchema, req.params);
  const comments = commentService
    .getCommentsForPublishedLevel(params.levelId)
    .map((comment) => parseOrThrow(CommentSchema, comment));
  res.json(success(comments));
});

playerRouter.post("/levels/:levelId/comments", (req, res) => {
  const params = parseOrThrow(LevelIdParamsSchema, req.params);
  const input = parseOrThrow(CreateCommentInputSchema, req.body);
  const currentUser = getCurrentUser(req);
  const comment = commentService.createComment(currentUser.id, params.levelId, input);
  res.status(201).json(success(parseOrThrow(CommentSchema, comment)));
});

playerRouter.post("/levels/:levelId/favorite", (req, res) => {
  const params = parseOrThrow(LevelIdParamsSchema, req.params);
  const currentUser = getCurrentUser(req);
  const favorite = favoriteService.addFavorite(currentUser.id, params.levelId);
  res.status(201).json(success(parseOrThrow(FavoriteSchema, favorite)));
});

playerRouter.delete("/levels/:levelId/favorite", (req, res) => {
  const params = parseOrThrow(LevelIdParamsSchema, req.params);
  const currentUser = getCurrentUser(req);
  const favorite = favoriteService.removeFavorite(currentUser.id, params.levelId);
  res.json(success(parseOrThrow(FavoriteSchema, favorite)));
});

playerRouter.get("/favorites", (req, res) => {
  const currentUser = getCurrentUser(req);
  const favoriteEntries = favoriteService
    .getFavoritesForUser(currentUser.id)
    .map((favorite) => ({
      ...favorite,
      level: levelService.getLevelById(favorite.levelId),
    }))
    // 收藏列表只展示仍然处于 published 的关卡，避免历史收藏露出无效数据。
    .filter((favorite) => favorite.level.status === "published")
    .map((favorite) => parseOrThrow(FavoriteWithLevelSchema, favorite));
  res.json(success(favoriteEntries));
});

playerRouter.post("/levels/:levelId/ratings", (req, res) => {
  const params = parseOrThrow(LevelIdParamsSchema, req.params);
  const input = parseOrThrow(CreateRatingInputSchema, req.body);
  const currentUser = getCurrentUser(req);
  const rating = ratingService.rateLevel(params.levelId, currentUser.id, input);
  res.status(201).json(success(parseOrThrow(RatingSchema, rating)));
});
