import { GetAdminCommentsRequestQuerySchema, GetAdminCommentsResponseDataSchema, type AdminComment } from "../../api-contracts.js";
import { request } from "../../client.js";

export const GetAdminCommentsApiPath = "/admin/comments" as const;

export class GetAdminCommentsApi {
  static readonly path = GetAdminCommentsApiPath;

  async execute(userId: string): Promise<AdminComment[]> {
    GetAdminCommentsRequestQuerySchema.parse({});
    return request(GetAdminCommentsApi.path, { method: "GET", headers: { "x-user-id": userId } }, GetAdminCommentsResponseDataSchema);
  }
}

export const getAdminCommentsApi = new GetAdminCommentsApi();

export const getAdminComments = async (userId: string): Promise<AdminComment[]> =>
  getAdminCommentsApi.execute(userId);
