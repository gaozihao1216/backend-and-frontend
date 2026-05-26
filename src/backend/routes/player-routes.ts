import { Router } from "express";
import {
  CreateCommentRequestBodySchema,
  CreateCommentRequestParamsSchema,
  CreateCommentResponseDataSchema,
  FavoriteLevelRequestParamsSchema,
  FavoriteLevelResponseDataSchema,
  GetFavoriteLevelsRequestQuerySchema,
  GetFavoriteLevelsResponseDataSchema,
  GetLevelCommentsRequestParamsSchema,
  GetLevelCommentsResponseDataSchema,
  GetPublishedLevelRequestParamsSchema,
  GetPublishedLevelResponseDataSchema,
  GetPublishedLevelsRequestQuerySchema,
  GetPublishedLevelsResponseDataSchema,
  RateLevelRequestBodySchema,
  RateLevelRequestParamsSchema,
  RateLevelResponseDataSchema,
  UnfavoriteLevelRequestParamsSchema,
  UnfavoriteLevelResponseDataSchema,
} from "../../shared/types.js";
import { HttpError, getCurrentUser, parseOrThrow, success } from "../lib/http.js";
import { requireRole } from "../middleware/auth.js";
import { commentService } from "../services/comment-service.js";
import { favoriteService } from "../services/favorite-service.js";
import { levelService } from "../services/level-service.js";
import { ratingService } from "../services/rating-service.js";

export const playerRouter = Router();

playerRouter.use(requireRole("player"));

playerRouter.get("/levels", (req, res) => {
  // 玩家端关卡列表支持按标签和排序方式筛选。
  const query = parseOrThrow(GetPublishedLevelsRequestQuerySchema, req.query);
  const options = {
    ...(query.tag ? { tag: query.tag } : {}),
    ...(query.sort ? { sort: query.sort } : {}),
  };
  const levels = levelService
    .getPublishedLevels(options)
    .map((level) => parseOrThrow(GetPublishedLevelsResponseDataSchema.element, level));
  res.json(success(parseOrThrow(GetPublishedLevelsResponseDataSchema, levels)));
});

playerRouter.get("/levels/:levelId", (req, res) => {
  const params = parseOrThrow(GetPublishedLevelRequestParamsSchema, req.params);
  const level = levelService.getLevelById(params.levelId);
  if (level.status !== "published") {
    // 对玩家来说，未发布关卡应该表现得像不存在，而不是泄露其真实状态。
    throw new HttpError(404, "LEVEL_NOT_FOUND", "Published level not found");
  }
  res.json(success(parseOrThrow(GetPublishedLevelResponseDataSchema, level)));
});

playerRouter.get("/levels/:levelId/comments", (req, res) => {
  const params = parseOrThrow(GetLevelCommentsRequestParamsSchema, req.params);
  const comments = commentService
    .getCommentsForPublishedLevel(params.levelId)
    .map((comment) => parseOrThrow(GetLevelCommentsResponseDataSchema.element, comment));
  res.json(success(parseOrThrow(GetLevelCommentsResponseDataSchema, comments)));
});

playerRouter.post("/levels/:levelId/comments", (req, res) => {
  const params = parseOrThrow(CreateCommentRequestParamsSchema, req.params);
  const input = parseOrThrow(CreateCommentRequestBodySchema, req.body);
  const currentUser = getCurrentUser(req);
  const comment = commentService.createComment(currentUser.id, params.levelId, input);
  res.status(201).json(success(parseOrThrow(CreateCommentResponseDataSchema, comment)));
});

playerRouter.post("/levels/:levelId/favorite", (req, res) => {
  const params = parseOrThrow(FavoriteLevelRequestParamsSchema, req.params);
  const currentUser = getCurrentUser(req);
  const favorite = favoriteService.addFavorite(currentUser.id, params.levelId);
  res.status(201).json(success(parseOrThrow(FavoriteLevelResponseDataSchema, favorite)));
});

playerRouter.delete("/levels/:levelId/favorite", (req, res) => {
  const params = parseOrThrow(UnfavoriteLevelRequestParamsSchema, req.params);
  const currentUser = getCurrentUser(req);
  const favorite = favoriteService.removeFavorite(currentUser.id, params.levelId);
  res.json(success(parseOrThrow(UnfavoriteLevelResponseDataSchema, favorite)));
});

playerRouter.get("/favorites", (req, res) => {
  parseOrThrow(GetFavoriteLevelsRequestQuerySchema, req.query);
  const currentUser = getCurrentUser(req);
  const favoriteEntries = favoriteService
    .getFavoritesForUser(currentUser.id)
    .map((favorite) => ({
      ...favorite,
      level: levelService.getLevelById(favorite.levelId),
    }))
    // 收藏列表只展示仍然处于 published 的关卡，避免历史收藏露出无效数据。
    .filter((favorite) => favorite.level.status === "published")
    .map((favorite) => parseOrThrow(GetFavoriteLevelsResponseDataSchema.element, favorite));
  res.json(success(parseOrThrow(GetFavoriteLevelsResponseDataSchema, favoriteEntries)));
});

playerRouter.post("/levels/:levelId/ratings", (req, res) => {
  const params = parseOrThrow(RateLevelRequestParamsSchema, req.params);
  const input = parseOrThrow(RateLevelRequestBodySchema, req.body);
  const currentUser = getCurrentUser(req);
  const rating = ratingService.rateLevel(params.levelId, currentUser.id, input);
  res.status(201).json(success(parseOrThrow(RateLevelResponseDataSchema, rating)));
});
