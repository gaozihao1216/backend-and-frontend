import {
  CreateCommentRequestBodySchema,
  CreateCommentResponseDataSchema,
  FavoriteLevelResponseDataSchema,
  GetFavoriteLevelsResponseDataSchema,
  GetLevelCommentsResponseDataSchema,
  GetPublishedLevelResponseDataSchema,
  GetPublishedLevelsResponseDataSchema,
  GetPublishedLevelsRequestQuerySchema,
  RateLevelRequestBodySchema,
  RateLevelResponseDataSchema,
  UnfavoriteLevelResponseDataSchema,
  type CreateCommentRequestBody,
  type GetPublishedLevelsRequestQuery,
  type LevelComment,
  type LevelRating,
  type PlayerFavorite,
  type PlayerFavoriteWithLevel,
  type PublishedLevel,
  type RateLevelRequestBody,
} from "../../../shared/types.js";
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
    `/player/levels/${levelId}`,
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    GetPublishedLevelResponseDataSchema,
  );

export const getFavoriteLevels = async (userId: string): Promise<PlayerFavoriteWithLevel[]> =>
  request(
    "/player/favorites",
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    GetFavoriteLevelsResponseDataSchema,
  );

export const favoriteLevel = async (userId: string, levelId: string): Promise<PlayerFavorite> =>
  request(
    `/player/levels/${levelId}/favorite`,
    {
      method: "POST",
      headers: { "x-user-id": userId },
    },
    FavoriteLevelResponseDataSchema,
  );

export const unfavoriteLevel = async (userId: string, levelId: string): Promise<PlayerFavorite> =>
  request(
    `/player/levels/${levelId}/favorite`,
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
    `/player/levels/${levelId}/ratings`,
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(RateLevelRequestBodySchema.parse(input)),
    },
    RateLevelResponseDataSchema,
  );

export const getLevelComments = async (userId: string, levelId: string): Promise<LevelComment[]> =>
  request(
    `/player/levels/${levelId}/comments`,
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
    `/player/levels/${levelId}/comments`,
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(CreateCommentRequestBodySchema.parse(input)),
    },
    CreateCommentResponseDataSchema,
  );
