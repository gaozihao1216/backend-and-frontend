import { DeleteCommentRequestParamsSchema, DeleteCommentResponseDataSchema, type AdminComment } from "../api-contracts.js";
import { request } from "../client.js";

export const deleteCommentApiPath = (commentId: string) => `/admin/comments/${commentId}` as const;

export const deleteComment = async (userId: string, commentId: string): Promise<AdminComment> =>
  request(deleteCommentApiPath(DeleteCommentRequestParamsSchema.parse({ commentId }).commentId), { method: "DELETE", headers: { "x-user-id": userId } }, DeleteCommentResponseDataSchema);
