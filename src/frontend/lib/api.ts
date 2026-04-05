import { z } from "zod";
import {
  CommentSchema,
  CreateCommentInputSchema,
  CreateLevelInputSchema,
  CreateRatingInputSchema,
  ErrorResponseSchema,
  FavoriteSchema,
  FavoriteWithLevelSchema,
  LevelDataSchema,
  LevelTagSchema,
  PublishedLevelsSortSchema,
  LevelSchema,
  RatingSchema,
  ReviewSubmissionInputSchema,
  SubmissionSchema,
  UserSchema,
  UserProfileSchema,
  createSuccessResponseSchema,
  type Comment,
  type CreateCommentInput,
  type CreateLevelInput,
  type CreateRatingInput,
  type Favorite,
  type FavoriteWithLevel,
  type Level,
  type LevelData,
  type LevelTag,
  type PublishedLevelsSort,
  type ReviewSubmissionInput,
  type Submission,
  type User,
  type UserProfile,
} from "../../shared/types.js";
import { API_BASE_URL } from "./config.js";

const JsonHeadersSchema = z.record(z.string(), z.string());
const REQUEST_TIMEOUT_MS = 10_000;

const parseApiResponse = async <T>(
  response: Response,
  dataSchema: z.ZodType<T>,
): Promise<T> => {
  const rawBody = await response.text();
  const contentType = response.headers.get("content-type") ?? "unknown";

  if (rawBody.trim().length === 0) {
    throw new Error(
      `Backend returned an empty response (${response.status} ${response.statusText}) for ${response.url || "the request"}.`,
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    throw new Error(
      `Backend returned a non-JSON response (${response.status} ${response.statusText}, content-type: ${contentType}).`,
    );
  }

  if (!response.ok) {
    const error = ErrorResponseSchema.safeParse(payload);
    if (error.success) {
      throw new Error(error.data.error.message);
    }
    throw new Error("Request failed");
  }

  const successSchema = createSuccessResponseSchema(dataSchema);
  const parsed = successSchema.parse(payload);
  return parsed.data as T;
};

const request = async <T>(
  path: string,
  init: RequestInit,
  responseSchema: z.ZodType<T>,
): Promise<T> => {
  const headers = JsonHeadersSchema.parse({
    "content-type": "application/json",
    ...init.headers,
  });

  const requestUrl = `${API_BASE_URL}${path}`;
  let response: Response;
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => {
    abortController.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    response = await fetch(requestUrl, {
      ...init,
      headers,
      signal: abortController.signal,
    });
  } catch (error) {
    window.clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s for ${path}. Check that the frontend can reach the backend and that the backend is responding.`,
      );
    }
    const target = API_BASE_URL || "the current frontend origin";
    const message =
      error instanceof Error ? error.message : "Unknown network error";
    throw new Error(
      `Cannot reach backend via ${target}. Start the backend on http://localhost:3000 and use the Vite dev server proxy, or set VITE_API_BASE_URL. Original error: ${message}`,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  return parseApiResponse(response, responseSchema);
};

export const createLevel = async (
  userId: string,
  input: CreateLevelInput,
): Promise<Level> =>
  request(
    "/designer/levels",
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(CreateLevelInputSchema.parse(input)),
    },
    LevelSchema,
  );

export const submitLevel = async (
  userId: string,
  levelId: string,
): Promise<Submission> =>
  request(
    "/designer/submissions",
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify({ levelId }),
    },
    SubmissionSchema,
  );

export const getPendingSubmissions = async (userId: string): Promise<Submission[]> =>
  request(
    "/admin/submissions/pending",
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    z.array(SubmissionSchema),
  );

export const reviewSubmission = async (
  userId: string,
  submissionId: string,
  input: ReviewSubmissionInput,
): Promise<Submission> =>
  request(
    `/admin/submissions/${submissionId}/review`,
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(ReviewSubmissionInputSchema.parse(input)),
    },
    SubmissionSchema,
  );

export const getPublishedLevels = async (
  userId: string,
  options?: { tag?: LevelTag; sort?: PublishedLevelsSort },
): Promise<Level[]> => {
  const params = new URLSearchParams();
  if (options?.tag) {
    params.set("tag", LevelTagSchema.parse(options.tag));
  }
  if (options?.sort) {
    params.set("sort", PublishedLevelsSortSchema.parse(options.sort));
  }

  const path = params.size > 0 ? `/player/levels?${params.toString()}` : "/player/levels";

  return request(
    path,
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    z.array(LevelSchema),
  );
};

export const getFavoriteLevels = async (userId: string): Promise<FavoriteWithLevel[]> =>
  request(
    "/player/favorites",
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    z.array(FavoriteWithLevelSchema),
  );

export const favoriteLevel = async (userId: string, levelId: string): Promise<Favorite> =>
  request(
    `/player/levels/${levelId}/favorite`,
    {
      method: "POST",
      headers: { "x-user-id": userId },
    },
    FavoriteSchema,
  );

export const unfavoriteLevel = async (userId: string, levelId: string): Promise<Favorite> =>
  request(
    `/player/levels/${levelId}/favorite`,
    {
      method: "DELETE",
      headers: { "x-user-id": userId },
    },
    FavoriteSchema,
  );

export const rateLevel = async (
  userId: string,
  levelId: string,
  input: CreateRatingInput,
) =>
  request(
    `/player/levels/${levelId}/ratings`,
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(CreateRatingInputSchema.parse(input)),
    },
    RatingSchema,
  );

export const getLevelComments = async (userId: string, levelId: string): Promise<Comment[]> =>
  request(
    `/player/levels/${levelId}/comments`,
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    z.array(CommentSchema),
  );

export const createComment = async (
  userId: string,
  levelId: string,
  input: CreateCommentInput,
): Promise<Comment> =>
  request(
    `/player/levels/${levelId}/comments`,
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(CreateCommentInputSchema.parse(input)),
    },
    CommentSchema,
  );

export const getAdminComments = async (userId: string): Promise<Comment[]> =>
  request(
    "/admin/comments",
    {
      method: "GET",
      headers: { "x-user-id": userId },
    },
    z.array(CommentSchema),
  );

export const deleteComment = async (userId: string, commentId: string): Promise<Comment> =>
  request(
    `/admin/comments/${commentId}`,
    {
      method: "DELETE",
      headers: { "x-user-id": userId },
    },
    CommentSchema,
  );

export const getUserProfile = async (
  viewerUserId: string,
  profileUserId: string,
): Promise<UserProfile> =>
  request(
    `/users/${profileUserId}/profile`,
    {
      method: "GET",
      headers: { "x-user-id": viewerUserId },
    },
    UserProfileSchema,
  );

export const bindBackendUser = async (input: {
  localUserId: string;
  nickname: string;
  role: User["role"];
}): Promise<User> =>
  request(
    "/users/bind",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    UserSchema,
  );

export const parseLevelDataInput = (value: string): LevelData =>
  LevelDataSchema.parse(JSON.parse(value) as unknown);

export const createDefaultLevelInput = (): CreateLevelInput => ({
  title: "",
  description: "",
  tags: [],
  data: {
    world: {
      width: 1200,
      height: 800,
      gravity: 9.8,
    },
    birdInventory: {
      basic: 3,
    },
    obstacles: [],
    enemies: [
      {
        id: "enemy-1",
        type: "pig",
        position: {
          x: 900,
          y: 120,
        },
      },
    ],
  },
});
