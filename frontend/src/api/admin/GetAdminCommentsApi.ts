import { GetAdminCommentsRequestQuerySchema, GetAdminCommentsResponseDataSchema, type AdminComment } from "../api-contracts.js";
import { request } from "../client.js";

export const getAdminComments = async (userId: string): Promise<AdminComment[]> => {
  GetAdminCommentsRequestQuerySchema.parse({});
  return request("/admin/comments", { method: "GET", headers: { "x-user-id": userId } }, GetAdminCommentsResponseDataSchema);
};
