import { GetAdminCommentsRequestQuerySchema, GetAdminCommentsResponseDataSchema, type AdminComment } from "../api-contracts.js";
import { request } from "../client.js";

export const GetAdminCommentsApiPath = "/admin/comments" as const;

export const getAdminComments = async (userId: string): Promise<AdminComment[]> => {
  GetAdminCommentsRequestQuerySchema.parse({});
  return request(GetAdminCommentsApiPath, { method: "GET", headers: { "x-user-id": userId } }, GetAdminCommentsResponseDataSchema);
};
