import { CreateCommentRequestBodySchema, CreateCommentRequestParamsSchema, CreateCommentResponseDataSchema, GetLevelCommentsRequestParamsSchema, GetLevelCommentsResponseDataSchema, type CreateCommentRequestBody, type LevelComment } from "../api-contracts.js";
import { request } from "../client.js";

export const getLevelComments = async (userId: string, levelId: string): Promise<LevelComment[]> =>
  request(`/player/levels/${GetLevelCommentsRequestParamsSchema.parse({ levelId }).levelId}/comments`, { method: "GET", headers: { "x-user-id": userId } }, GetLevelCommentsResponseDataSchema);

export const createComment = async (userId: string, levelId: string, input: CreateCommentRequestBody): Promise<LevelComment> =>
  request(`/player/levels/${CreateCommentRequestParamsSchema.parse({ levelId }).levelId}/comments`, { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(CreateCommentRequestBodySchema.parse(input)) }, CreateCommentResponseDataSchema);
