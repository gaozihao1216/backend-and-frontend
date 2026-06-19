import { CreateCommentRequestBodySchema, CreateCommentRequestParamsSchema, CreateCommentResponseDataSchema, type CreateCommentRequestBody, type LevelComment } from "../../../api-contracts.js";
import { request } from "../../../client.js";

export const createCommentApiPath = (levelId: string) => `/player/levels/${levelId}/comments` as const;

export class CreateCommentApi {
  path(levelId: string): string {
    return createCommentApiPath(levelId);
  }

  async execute(userId: string, levelId: string, input: CreateCommentRequestBody): Promise<LevelComment> {
    const params = CreateCommentRequestParamsSchema.parse({ levelId });
    return request(
      this.path(params.levelId),
      { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(CreateCommentRequestBodySchema.parse(input)) },
      CreateCommentResponseDataSchema,
    );
  }
}

export const createCommentApi = new CreateCommentApi();

export const createComment = async (userId: string, levelId: string, input: CreateCommentRequestBody): Promise<LevelComment> =>
  createCommentApi.execute(userId, levelId, input);
