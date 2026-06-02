import { DeleteCommentRequestParamsSchema, DeleteCommentResponseDataSchema, GetAdminCommentsRequestQuerySchema, GetAdminCommentsResponseDataSchema, type AdminComment } from "../api-contracts.js";
import { request } from "../client.js";

export const getAdminComments = async (userId: string): Promise<AdminComment[]> => {
  GetAdminCommentsRequestQuerySchema.parse({});
  return request("/admin/comments", { method: "GET", headers: { "x-user-id": userId } }, GetAdminCommentsResponseDataSchema);
};

export const deleteComment = async (userId: string, commentId: string): Promise<AdminComment> =>
  request(`/admin/comments/${DeleteCommentRequestParamsSchema.parse({ commentId }).commentId}`, { method: "DELETE", headers: { "x-user-id": userId } }, DeleteCommentResponseDataSchema);
