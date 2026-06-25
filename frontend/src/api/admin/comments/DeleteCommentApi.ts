import { DeleteCommentRequestParamsSchema, DeleteCommentResponseDataSchema, type AdminComment } from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";

export const deleteCommentApiPath = (commentId: string) => `/admin/comments/${commentId}` as const;

export class DeleteCommentApi {
  path(commentId: string): string {
    return deleteCommentApiPath(commentId);
  }

  async execute(userId: string, commentId: string): Promise<AdminComment> {
    const params = DeleteCommentRequestParamsSchema.parse({ commentId });
    return request(this.path(params.commentId), { method: "DELETE", headers: { "x-user-id": userId } }, DeleteCommentResponseDataSchema);
  }
}

export const deleteCommentApi = new DeleteCommentApi();

export const deleteComment = async (userId: string, commentId: string): Promise<AdminComment> =>
  deleteCommentApi.execute(userId, commentId);
