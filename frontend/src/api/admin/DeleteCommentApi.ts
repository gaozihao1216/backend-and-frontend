import { DeleteCommentRequestParamsSchema, DeleteCommentResponseDataSchema, type AdminComment } from "../api-contracts.js";
import { request } from "../client.js";

export const deleteComment = async (userId: string, commentId: string): Promise<AdminComment> =>
  request(`/admin/comments/${DeleteCommentRequestParamsSchema.parse({ commentId }).commentId}`, { method: "DELETE", headers: { "x-user-id": userId } }, DeleteCommentResponseDataSchema);
