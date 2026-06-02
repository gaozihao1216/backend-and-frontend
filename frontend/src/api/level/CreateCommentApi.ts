import { CreateCommentRequestBodySchema, CreateCommentRequestParamsSchema, CreateCommentResponseDataSchema, type CreateCommentRequestBody, type LevelComment } from "../api-contracts.js";
import { request } from "../client.js";

export const createCommentApiPath = (levelId: string) => `/player/levels/${levelId}/comments` as const;

export const createComment = async (userId: string, levelId: string, input: CreateCommentRequestBody): Promise<LevelComment> =>
  request(createCommentApiPath(CreateCommentRequestParamsSchema.parse({ levelId }).levelId), { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(CreateCommentRequestBodySchema.parse(input)) }, CreateCommentResponseDataSchema);
