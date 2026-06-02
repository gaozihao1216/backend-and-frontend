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
  GetPublishedLevelsResponseDataSchema,
  GetPublishedLevelsRequestQuerySchema,
  RateLevelRequestBodySchema,
  RateLevelRequestParamsSchema,
  RateLevelResponseDataSchema,
  UnfavoriteLevelRequestParamsSchema,
  UnfavoriteLevelResponseDataSchema,
  type CreateCommentRequestBody,
  type GetPublishedLevelsRequestQuery,
  type LevelComment,
  type LevelRating,
  type PlayerFavorite,
  type PlayerFavoriteWithLevel,
  type PublishedLevel,
  type RateLevelRequestBody,
} from "./api-contracts.js";
import { request } from "./client.js";

export const getPublishedLevels = async (
  userId: string,
  options?: GetPublishedLevelsRequestQuery,
): Promise<PublishedLevel[]> => {
  const query = GetPublishedLevelsRequestQuerySchema.parse(options ?? {});
  const params = new URLSearchParams();

  if (query.tag) {
    params.set("tag", query.tag);
  }
  if (query.sort) {
    params.set("sort", query.sort);
  }

  const path = params.size > 0 ? `/player/levels?${params.toString()}` : "/player/levels";

  return request(
    path,
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    GetPublishedLevelsResponseDataSchema,
  );
};

export const getPublishedLevel = async (
  userId: string,
  levelId: string,
): Promise<PublishedLevel> =>
  request(
    `/player/levels/${GetPublishedLevelRequestParamsSchema.parse({ levelId }).levelId}`,
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    GetPublishedLevelResponseDataSchema,
  );

export const getFavoriteLevels = async (userId: string): Promise<PlayerFavoriteWithLevel[]> => {
  GetFavoriteLevelsRequestQuerySchema.parse({});

  return request(
    "/player/favorites",
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    GetFavoriteLevelsResponseDataSchema,
  );
};

export const favoriteLevel = async (userId: string, levelId: string): Promise<PlayerFavorite> =>
  request(
    `/player/levels/${FavoriteLevelRequestParamsSchema.parse({ levelId }).levelId}/favorite`,
    {
      method: "POST",
      headers: { "x-user-id": userId },
    },
    FavoriteLevelResponseDataSchema,
  );

export const unfavoriteLevel = async (userId: string, levelId: string): Promise<PlayerFavorite> =>
  request(
    `/player/levels/${UnfavoriteLevelRequestParamsSchema.parse({ levelId }).levelId}/favorite`,
    {
      method: "DELETE",
      headers: { "x-user-id": userId },
    },
    UnfavoriteLevelResponseDataSchema,
  );

export const rateLevel = async (
  userId: string,
  levelId: string,
  input: RateLevelRequestBody,
): Promise<LevelRating> =>
  request(
    `/player/levels/${RateLevelRequestParamsSchema.parse({ levelId }).levelId}/ratings`,
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(RateLevelRequestBodySchema.parse(input)),
    },
    RateLevelResponseDataSchema,
  );

export const getLevelComments = async (userId: string, levelId: string): Promise<LevelComment[]> =>
  request(
    `/player/levels/${GetLevelCommentsRequestParamsSchema.parse({ levelId }).levelId}/comments`,
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    GetLevelCommentsResponseDataSchema,
  );

export const createComment = async (
  userId: string,
  levelId: string,
  input: CreateCommentRequestBody,
): Promise<LevelComment> =>
  request(
    `/player/levels/${CreateCommentRequestParamsSchema.parse({ levelId }).levelId}/comments`,
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(CreateCommentRequestBodySchema.parse(input)),
    },
    CreateCommentResponseDataSchema,
  );
